with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("'&': '&'", "'&': '&'")
with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed!')
