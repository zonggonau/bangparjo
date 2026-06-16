import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add formatCurrency function
old_get_price = """  function getDisplayPrice(v: any) {
    if (v.sellingPrice != null) return v.sellingPrice;
    if (v.price != null) return v.price;
    return v;
  }"""

new_get_price = """  function getDisplayPrice(v: any) {
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
  }"""

content = content.replace(old_get_price, new_get_price)

# 2. Replace priceDisplay calculation
old_price_display = "  var priceDisplay = minPrice === maxPrice\n    ? '$' + minPrice.toFixed(2)\n    : '$' + minPrice.toFixed(2) + ' - $' + maxPrice.toFixed(2);"
new_price_display = "  var priceDisplay = minPrice === maxPrice\n    ? formatCurrency(minPrice)\n    : formatCurrency(minPrice) + ' - ' + formatCurrency(maxPrice);"
content = content.replace(old_price_display, new_price_display)

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

# 7. Inject fmtCurr JS logic (doing it carefully)
js_injection = """  result += '<script>\\n'
    + '(function() {\\n'
    + 'var productData = ' + JSON.stringify(clientData) + ';\\n'
    + 'var selectedVariant = productData.variants[0];\\n'
    + 'var isIndoJs = ' + (isIndo ? 'true' : 'false') + ';\\n'
    + 'function fmtCurr(usd) {\\n'
    + '  if(isIndoJs) { return "Rp " + Math.round(usd * 16000).toString().replace(/\\\\B(?=(\\\\d{3})+(?!\\\\d))/g, "."); }\\n'
    + '  return "$" + parseFloat(usd).toFixed(2);\\n'
    + '}\\n'"""

content = content.replace("  result += '<script>\\n'\n    + '(function() {\\n'\n    + 'var productData = ' + JSON.stringify(clientData) + ';\\n'\n    + 'var selectedVariant = productData.variants[0];\\n'", js_injection)

# 8. Replace total formatting in JS block
content = content.replace("if(displayEl) displayEl.textContent = \"$\" + total.toFixed(2);", "if(displayEl) displayEl.textContent = fmtCurr(total);")
content = content.replace("if(compareEl) compareEl.textContent = \"$\" + (selectedVariant.price * 1.5 * quantity).toFixed(2);", "if(compareEl) compareEl.textContent = fmtCurr(selectedVariant.price * 1.35 * quantity);")

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("done")
