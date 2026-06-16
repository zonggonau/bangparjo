import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Insert variable extraction
var_extraction = """
  var resellerOpportunity = ai.resellerOpportunity || {
    title: 'Peluang Bisnis Menguntungkan',
    description: 'Produk impor berkualitas tinggi ini tidak hanya cocok untuk dipakai sendiri, tapi juga sangat potensial untuk dijual kembali. Dapatkan harga langsung supplier!',
    profitMargin: 'Potensi Margin 50% - 150%'
  };
"""

if 'var resellerOpportunity' not in content:
    content = content.replace('var shippingPolicy =', var_extraction + '\n  var shippingPolicy =')

# 2. HTML block
reseller_html = """
  var resellerHtml = '';
  if (resellerOpportunity) {
    resellerHtml = '<section class="section" style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); border-top: 1px solid #FFCC80; border-bottom: 1px solid #FFCC80; padding: 40px 0;">\\n'
      + '<div class="container">\\n'
      + '<div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(255,107,53,0.1); border: 2px solid #FF6B35; text-align: center;">\\n'
      + '<div style="width: 64px; height: 64px; background: #FFF3E0; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">'
      + '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>'
      + '</div>\\n'
      + '<h2 style="font-family: Outfit, sans-serif; font-size: 24px; font-weight: 800; color: #1A1A2E; margin-bottom: 12px;">' + h(resellerOpportunity.title) + '</h2>\\n'
      + '<p style="font-size: 15px; color: #475569; line-height: 1.6; max-width: 600px; margin: 0 auto 20px;">' + h(resellerOpportunity.description) + '</p>\\n'
      + '<div style="display: inline-block; background: #FF6B35; color: white; padding: 8px 16px; border-radius: 99px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">&#128176; ' + h(resellerOpportunity.profitMargin) + '</div>\\n'
      + '</div>\\n'
      + '</div>\\n'
      + '</section>\\n';
    result += resellerHtml;
  }
"""

if 'resellerHtml =' not in content:
    target = "    + '</section>\\n';"
    # We want to inject right after the Benefits section, which ends with </section>\n
    # and right before "// Rating stars"
    idx = content.find('  // Rating stars')
    if idx != -1:
        content = content[:idx] + reseller_html + '\n' + content[idx:]
    else:
        print("Couldn't find target location to inject reseller HTML")

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated blog-templates.ts with reseller opportunity section.")
