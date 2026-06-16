import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    (">Sold</div>", ">' + h(ui.sold) + '</div>"),
    (">Rating</div>", ">' + h(ui.rating) + '</div>"),
    (">Reviews</div>", ">' + h(ui.reviews) + '</div>"),
    (" (' + h(socialProof.reviews) + ' reviews)", " (' + h(socialProof.reviews) + ' ' + h(ui.reviews).toLowerCase() + ')"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("Missed replacements done.")
