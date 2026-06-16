import re

with open('src/lib/blog-templates.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Make the policy section have an ID
old_policy = "  result += '<section class=\"section\" style=\"background:#fafafa;\">\\n'\n    + '<div class=\"container\">\\n'\n    + '<div class=\"section-title\">\\n'\n    + '<h2>' + h(sections.policyTitle) + '</h2>\\n'"

new_policy = "  result += '<section id=\"shipping-policy\" class=\"section\" style=\"background:#fafafa;\">\\n'\n    + '<div class=\"container\">\\n'\n    + '<div class=\"section-title\">\\n'\n    + '<h2>' + h(sections.policyTitle) + '</h2>\\n'"

content = content.replace(old_policy, new_policy)

with open('src/lib/blog-templates.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print("policy updated")
