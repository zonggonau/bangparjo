import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Insert sections and ui definitions
insert_idx = content.find('  // --- Safe HTML helpers ---')
insert_str = """
  var sections = (product as any).sections || ai.sections || {
    benefitsTitle: 'Why Choose This Product?',
    benefitsSub: "Benefits you'll get.",
    galleryTitle: 'Product Gallery',
    gallerySub: 'See the product from every angle.',
    detailsTitle: 'Product Details',
    detailsSub: 'Complete info about ' + product.name,
    variantsTitle: 'Variants & Pricing',
    variantsSub: 'Choose the variant that fits your needs.',
    descTitle: 'Description',
    descSub: 'Full details of ' + product.name,
    checkoutTitle: 'Select Your Variant & Order Now',
    checkoutSub: 'Choose your size/color and proceed to secure checkout.',
    shippingTitle: 'Shipping Options',
    shippingSub: 'Real-time shipping rates.',
    policyTitle: 'Shipping & Return Policy',
    policySub: 'Important info before ordering.'
  };

  var ui = (product as any).ui || ai.ui || {
    orderNow: 'Order Now',
    inStock: 'In Stock',
    outOfStock: 'Out of Stock',
    preOrder: 'Pre-Order',
    peopleViewing: 'people viewing now',
    leftInStock: 'left in stock',
    timeLeft: 'left',
    sold: 'Sold',
    rating: 'Rating',
    reviews: 'Reviews',
    productName: 'Product Name',
    price: 'Price',
    variants: 'Variants',
    totalStock: 'Total Stock',
    weight: 'Weight',
    sku: 'SKU',
    selectedVariant: 'Selected Variant',
    selectVariant: 'Select Variant',
    quantity: 'Quantity',
    sslSecure: 'SSL Secure',
    fastDelivery: 'Fast Delivery',
    allCards: 'All Cards',
    tableVariant: 'Variant',
    tableSku: 'SKU',
    tableStock: 'Stock',
    tablePrice: 'Price',
    tableMethod: 'Method',
    tableEst: 'Estimated Delivery',
    tableCost: 'Cost',
    free: 'FREE',
    shippingDisclaimer: 'Shipping costs and times are estimates.',
    shippingTab: 'Shipping',
    warrantyTab: 'Warranty & Returns'
  };

"""
content = content[:insert_idx] + insert_str + content[insert_idx:]

# Now replace the hardcoded strings
replacements = [
    # General UI
    ("'Default'", "ui.default || 'Default'"),
    ("'&#10003; In Stock'", "'&#10003; ' + ui.inStock"),
    ("'Out of Stock'", "ui.outOfStock"),
    ("'&#9989; In Stock'", "'&#9989; ' + ui.inStock"),
    ("'&#9203; Pre-Order'", "'&#9203; ' + ui.preOrder"),
    ("'Sold'", "ui.sold"),
    ("'Rating'", "ui.rating"),
    ("'Reviews'", "ui.reviews"),
    ("' people viewing now</span>'", "' ' + ui.peopleViewing + '</span>'"),
    ("' left in stock</span>'", "' ' + ui.leftInStock + '</span>'"),
    ("' left</span>'", "' ' + ui.timeLeft + '</span>'"),
    ("'Only ' + totalInventory + ' left in stock — Order soon!'", "'Only ' + totalInventory + ' ' + ui.leftInStock + '!'"),
    
    # Hero Actions
    ("Order Now — '", "' + ui.orderNow + ' — '"),
    
    # Sections
    ("<h2>Why Choose This Product?</h2>", "<h2>' + h(sections.benefitsTitle) + '</h2>"),
    ("<p>Benefits you\\'ll get.</p>", "<p>' + h(sections.benefitsSub) + '</p>"),
    ("<h2>Product Gallery</h2>", "<h2>' + h(sections.galleryTitle) + '</h2>"),
    ("<p>See the product from every angle.</p>", "<p>' + h(sections.gallerySub) + '</p>"),
    ("<h2>Product Details</h2>", "<h2>' + h(sections.detailsTitle) + '</h2>"),
    ("<p>Complete info about ' + safeName + '</p>", "<p>' + h(sections.detailsSub) + '</p>"),
    ("<h2>Variants & Pricing</h2>", "<h2>' + h(sections.variantsTitle) + '</h2>"),
    ("<p>Choose the variant that fits your needs.</p>", "<p>' + h(sections.variantsSub) + '</p>"),
    ("<h2>Description</h2>", "<h2>' + h(sections.descTitle) + '</h2>"),
    ("<p>Full details of ' + safeName + '</p>", "<p>' + h(sections.descSub) + '</p>"),
    ("<h2>Select Your Variant & Order Now</h2>", "<h2>' + h(sections.checkoutTitle) + '</h2>"),
    ("<p>Choose your size/color and proceed to secure checkout.</p>", "<p>' + h(sections.checkoutSub) + '</p>"),
    ("<h2>Shipping Options</h2>", "<h2>' + h(sections.shippingTitle) + '</h2>"),
    ("<p>Real-time shipping rates to United States.</p>", "<p>' + h(sections.shippingSub) + '</p>"),
    ("<h2>Shipping & Return Policy</h2>", "<h2>' + h(sections.policyTitle) + '</h2>"),
    ("<p>Important info before ordering.</p>", "<p>' + h(sections.policySub) + '</p>"),
    
    # Details Labels
    ("<div class=\"detail-label\">Product Name</div>", "<div class=\"detail-label\">' + h(ui.productName) + '</div>"),
    ("<div class=\"detail-label\">Price</div>", "<div class=\"detail-label\">' + h(ui.price) + '</div>"),
    ("<div class=\"detail-label\">Variants</div>", "<div class=\"detail-label\">' + h(ui.variants) + '</div>"),
    ("<div class=\"detail-label\">Total Stock</div>", "<div class=\"detail-label\">' + h(ui.totalStock) + '</div>"),
    ("<div class=\"detail-label\">Weight</div>", "<div class=\"detail-label\">' + h(ui.weight) + '</div>"),
    ("<div class=\"detail-label\">SKU</div>", "<div class=\"detail-label\">' + h(ui.sku) + '</div>"),
    
    # Table Headers
    ("<th>Variant</th>", "<th>' + h(ui.tableVariant) + '</th>"),
    ("<th>SKU</th>", "<th>' + h(ui.tableSku) + '</th>"),
    ("<th>Stock</th>", "<th>' + h(ui.tableStock) + '</th>"),
    ("<th>Price</th>", "<th>' + h(ui.tablePrice) + '</th>"),
    ("<th>Method</th>", "<th>' + h(ui.tableMethod) + '</th>"),
    ("<th>Estimated Delivery</th>", "<th>' + h(ui.tableEst) + '</th>"),
    ("<th>Cost</th>", "<th>' + h(ui.tableCost) + '</th>"),
    
    # Misc Checkout
    ("Selected Variant</span>", "' + h(ui.selectedVariant) + '</span>"),
    ("Select Variant</label>", "' + h(ui.selectVariant) + '</label>"),
    ("Quantity</label>", "' + h(ui.quantity) + '</label>"),
    ("&#128722; Order Now\\n'", "'&#128722; ' + h(ui.orderNow) + '\\n'"),
    ("SSL Secure</span>", "' + h(ui.sslSecure) + '</span>"),
    ("Fast Delivery</span>", "' + h(ui.fastDelivery) + '</span>"),
    ("All Cards</span>", "' + h(ui.allCards) + '</span>"),
    ("FREE'", "ui.free'"),
    ("Shipping costs and times are estimates. Actual rates may vary based on location and order size.", "' + h(ui.shippingDisclaimer) + '"),
    ("Shipping</h4>", "' + h(ui.shippingTab) + '</h4>"),
    ("Warranty & Returns</h4>", "' + h(ui.warrantyTab) + '</h4>")
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done replacing.")
