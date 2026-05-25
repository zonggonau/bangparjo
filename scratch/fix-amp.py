import sys
with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    c = f.read()
c = c.replace("'&': '&'", "'&': '&'")
with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(c)
print('Fixed!')
