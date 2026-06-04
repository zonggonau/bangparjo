const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, '../Perjanjianpengguna.md');
const outPath = path.join(__dirname, '../src/app/(store)/terms/page.tsx');

let content = fs.readFileSync(mdPath, 'utf-8');

// Replace CJ with BangParjo
content = content.replace(/CJdropshipping\.com/g, 'bangparjo.shop');
content = content.replace(/CJdropshipping/g, 'BangParjo.shop');
content = content.replace(/Perusahaan CJ/g, 'Perusahaan BangParjo');
content = content.replace(/Platform CJ/g, 'Platform BangParjo.shop');
content = content.replace(/Situs Web CJ/g, 'Situs Web BangParjo.shop');
content = content.replace(/Mal CJ/g, 'Mal BangParjo.shop');
content = content.replace(/Layanan Platform CJ/g, 'Layanan Platform BangParjo.shop');
content = content.replace(/Layanan CJ/g, 'Layanan BangParjo.shop');
content = content.replace(/Aturan Platform CJ/g, 'Aturan Platform BangParjo.shop');
content = content.replace(/Pengguna CJ/g, 'Pengguna BangParjo.shop');
content = content.replace(/Akun CJ/g, 'Akun BangParjo.shop');
content = content.replace(/Mitra CJ/g, 'Mitra BangParjo.shop');
content = content.replace(/Aplikasi CJ/g, 'Aplikasi BangParjo.shop');
content = content.replace(/CJ/g, 'BangParjo.shop');
content = content.replace(/Yiwu Cujia Trade Co., Ltd./g, 'BangParjo');

const lines = content.split('\n');

let jsxContent = `import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Perjanjian Pengguna | bangparjo.shop',
};

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-5">
        <div className="text-center py-20">
          <div className="flex justify-center gap-3 mb-6">
            <i className="fas fa-file-contract text-[#FF6B00]"></i>
            <span className="text-[#FF6B00] font-bold text-xs tracking-[0.2em] uppercase">Compliance Protocol</span>
          </div>
          <h1 className="text-[48px] font-black text-[#1A1A1A] mb-4">Perjanjian <span className="text-[#FF6B00]">Pengguna</span></h1>
        </div>

        <div className="max-w-[800px] mx-auto pb-20 space-y-6 text-[#1A1A1A]">
`;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  if (line.match(/^[IVX]+\.\s/)) {
    // Header level 2 (Roman numerals)
    jsxContent += `          <h2 className="text-2xl font-bold mt-10 mb-4 border-b pb-2 text-[#FF6B00]">${line.replace(/([{}<>])/g, '')}</h2>\n`;
  } else if (line.match(/^\d+\.\s/)) {
    // Numbered list item
    jsxContent += `          <div className="flex gap-4 items-start">
            <span className="font-bold min-w-[24px]">${line.split('.')[0]}.</span>
            <p className="leading-relaxed text-gray-700">${line.substring(line.indexOf('.') + 1).trim().replace(/([{}<>])/g, '')}</p>
          </div>\n`;
  } else if (line.match(/^\(\d+\)/)) {
    // Sub list item (1)
    jsxContent += `          <div className="flex gap-4 items-start ml-8">
            <span className="font-bold min-w-[28px]">${line.split(')')[0]}).</span>
            <p className="leading-relaxed text-gray-600">${line.substring(line.indexOf(')') + 1).trim().replace(/([{}<>])/g, '')}</p>
          </div>\n`;
  } else if (line.match(/^Tanggal/)) {
    jsxContent += `          <p className="text-gray-500 font-semibold">${line}</p>\n`;
  } else {
    // Normal paragraph
    jsxContent += `          <p className="leading-relaxed text-gray-700">${line.replace(/([{}<>])/g, '')}</p>\n`;
  }
}

jsxContent += `
          <div className="text-center opacity-30 pt-10 border-t mt-10">
            <p className="text-[10px] font-black tracking-[0.4em]">END OF TRANSMISSION</p>
          </div>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(outPath, jsxContent);
console.log('Successfully generated terms page!');
