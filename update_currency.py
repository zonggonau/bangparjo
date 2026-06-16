import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add formatCurrency function to server-side template
format_func = """  function getDisplayPrice(v: any) {
    if (v.sellingPrice != null) return v.sellingPrice;
    if (v.price != null) return v.price;
    return v;
  }

  var isIndo = lang.toLowerCase() === 'id';
  var exchangeRate = 16000;
  function formatCurrency(usdValue: number) {
    if (isIndo) {
      var idr = Math.round(usdValue * exchangeRate);
      return 'Rp ' + idr.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");
    }
    return '$' + usdValue.toFixed(2);
  }
"""
content = re.sub(r'  function getDisplayPrice.*?return v;\n  }', format_func, content, flags=re.DOTALL)

# 2. Replace priceDisplay calculation
content = content.replace("  var priceDisplay = minPrice === maxPrice\n    ? '$' + minPrice.toFixed(2)\n    : '$' + minPrice.toFixed(2) + ' - $' + maxPrice.toFixed(2);",
                          "  var priceDisplay = minPrice === maxPrice\n    ? formatCurrency(minPrice)\n    : formatCurrency(minPrice) + ' - ' + formatCurrency(maxPrice);")

# 3. Replace variant table prices
content = content.replace("color:#FF6B35;\">$' + getDisplayPrice(v).toFixed(2)", "color:#FF6B35;\">' + formatCurrency(getDisplayPrice(v))")
content = content.replace("margin-left:6px;\">$' + (getDisplayPrice(v) * 1.35).toFixed(2) + '</span></td>'", "margin-left:6px;\">' + formatCurrency(getDisplayPrice(v) * 1.35) + '</span></td>'")

# 4. Replace <option> prices in checkout
content = content.replace("h(vName) + ' - $' + getDisplayPrice(v).toFixed(2) + '</option>'", "h(vName) + ' - ' + formatCurrency(getDisplayPrice(v)) + '</option>'")

# 5. Replace checkout initial prices
content = content.replace("line-height: 1;\">$' + initialPrice.toFixed(2) + '</span>\\n'", "line-height: 1;\">' + formatCurrency(initialPrice) + '</span>\\n'")
content = content.replace("font-weight: 500;\">$' + initialComparePrice.toFixed(2) + '</span>\\n'", "font-weight: 500;\">' + formatCurrency(initialComparePrice) + '</span>\\n'")

# 6. Replace shipping method cost
content = content.replace("var costDisplay = m.shippingCost > 0 ? '$' + m.shippingCost.toFixed(2) : 'ui.free';", "var costDisplay = m.shippingCost > 0 ? formatCurrency(m.shippingCost) : (ui.free || 'Free');")

# 7. Add fmtCurr function to the client-side JavaScript block
js_block_insert = """
    + 'var isIndoJs = ' + (isIndo ? 'true' : 'false') + ';\\n'
    + 'function fmtCurr(usd) {\\n'
    + '  if(isIndoJs) { return "Rp " + Math.round(usd * 16000).toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, "."); }\\n'
    + '  return "$" + usd.toFixed(2);\\n'
    + '}\\n'
    + 'function updateCheckoutTotal() {\\n'
"""
content = content.replace("    + 'function updateCheckoutTotal() {\\n'", js_block_insert)

# 8. Replace total and compareEl formatting in client-side JS
content = content.replace("if(displayEl) displayEl.textContent = \"$\" + total.toFixed(2);", "if(displayEl) displayEl.textContent = fmtCurr(total);")
content = content.replace("if(compareEl) compareEl.textContent = \"$\" + (selectedVariant.price * 1.5 * quantity).toFixed(2);", "if(compareEl) compareEl.textContent = fmtCurr(selectedVariant.price * 1.35 * quantity);")

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
