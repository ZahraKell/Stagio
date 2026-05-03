import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const fixes = [
    // 4-byte emojis (longest first)
    ['c3b0c5b8e2809cc2ad', 'f09f93ad'],    // 📭
    ['c3b0c5b8e28098c281', 'f09f9181'],    // 👁
    ['c3a2e280a0e28098', 'e28691'],        // ↑
    ['c3a2e280a0e2809c', 'e28693'],        // ↓
    ['c3a2cb9ce280a0', 'e29886'],          // ☆
    ['c3b0c5b8e2809cc5a1', 'f09f939a'],   // 📚
    ['c3b0c5b8c28fc2ab', 'f09f8fab'],     // 🏫
    ['c3b0c5b8e2809dc290', 'f09f9490'],    // 🔐
    ['c3b0c5b8e2809de28098', 'f09f9491'],    // 🔑
    ['c3b0c5b8e28098c290', 'f09f9190'],      // 👐
    ['c3a2c593c28dc3afc2b8c28f', 'e29c8defb88f'],  // ✍️
    ['c3b0c5b8e2809cc29d', 'f09f939d'],      // 📝
    ['c3b0c5b8e2809cc2b0', 'f09f93b0'],      // 📰
    ['c3a2e2809de282ac', 'e29480'],          // ─
    ['c3a2e2809dc281', 'e29481'],            // ━
    ['c3a2e280a2c290', 'e29590'],            // ═
    ['c3a2e282acc2a2', 'e280a2'],            // •
    ['c382c2b7', 'c2b7'],                    // ·
    ['c3b0c5b8e2809de28099', 'f09f9492'],    // 🔒 lock
    ['c3b0c5b8e2809de2809c', 'f09f9493'],    // 🔓 unlock
    ['c3b0c5b8e28098c5bd', 'f09f918e'],      // 👎 thumbdown
    ['c3b0c5b8e2809dc2ab', 'f09f94ab'],      // 🔫
    ['c3b0c5b8e2809cc28d', 'f09f938d'],      // 📍
    ['c3b0c5b8e28094c2bac3afc2b8c28f', 'f09f97baefb88f'],  // 🗺️
    ['c3b0c5b8e28098c281c3afc2b8c28f', 'f09f9181efb88f'],  // 👁️
    ['c3a2c593e2809c', 'e29c93'],            // ✓
    ['c3a2c593e2809dc3afc2b8c28f', 'e29c94efb88f'],  // ✔️
    ['c3a2c593e2809d', 'e29c94'],            // ✔
    ['c3b0c5b8e2809cc5a0', 'f09f938a'],    // 📊
    ['c3b0c5b8e2809ce280b9', 'f09f938b'],  // 📋
    ['c3b0c5b8e2809cc281', 'f09f9381'],    // 📁
    ['c3b0c5b8e2809ce2809e', 'f09f9384'],  // 📄
    ['c3b0c5b8c5bde2809c', 'f09f8e93'],    // 🎓
    ['c3b0c5b8c28fc2a2', 'f09f8fa2'],      // 🏢
    ['c3b0c5b8e28098c2a5', 'f09f91a5'],    // 👥
    ['c3b0c5b8e2809cc2a7', 'f09f93a7'],    // 📧
    ['c3b0c5b8e2809ccb86', 'f09f9388'],    // 📈
    ['c3b0c5b8e2809de2809d', 'f09f9494'],  // 🔔
    ['c3b0c5b8c5a1c2aa', 'f09f9aaa'],      // 🚪
    ['c3b0c5b8c5bde280b0', 'f09f8e89'],    // 🎉
    ['c3b0c5b8e28099c2bc', 'f09f92bc'],    // 💼
    ['c3b0c5b8e28098c2a4', 'f09f91a4'],    // 👤
    ['c3b0c5b8e2809ce280a6', 'f09f9385'],  // 📅
    ['c3b0c5b8e2809dc28d', 'f09f948d'],    // 🔍
    ['c3b0c5b8e2809dc5bd', 'f09f948e'],    // 🔎
    ['c3b0c5b8c5a1e282ac', 'f09f9a80'],    // 🚀
    ['c3b0c5b8e28099c2b0', 'f09f92b0'],    // 💰
    ['c3b0c5b8e2809ce28093', 'f09f9396'],  // 📖
    ['c3b0c5b8e2809cc2ac', 'f09f93ac'],    // 📬
    ['c3b0c5b8c5bdc2af', 'f09f8eaf'],      // 🎯
    ['c3b0c5b8e2809cc592', 'f09f938c'],    // 📌
    ['c3b0c5b8e28094c28f', 'f09f978f'],    // 🗑 (variant)
    ['c3b0c5b8e28094e28098', 'f09f9791'],  // 🗑
    ['c3b0c5b8c28fe280a0', 'f09f8f86'],    // 🏆
    ['c3b0c5b8e2809cc5be', 'f09f939e'],    // 📞
    ['c3b0c5b8e28098c28d', 'f09f918d'],    // 👍
    ['c3b0c5b8e28099c2be', 'f09f92be'],    // 💾
    ['c3b0c5b8e2809cc2ab', 'f09f93ab'],    // 📫
    ['c3b0c5b8e28098e280b9', 'f09f918b'],  // 👋
    // 3-byte with variation selector (✏️ ✉️ ⚙️)
    ['c3a2c593c28fc3afc2b8c28f', 'e29c8fefb88f'],   // ✏️
    ['c3a2c593e280b0c3afc2b8c28f', 'e29c89efb88f'],  // ✉️
    ['c3a2c5a1e284a2c3afc2b8c28f', 'e29a99efb88f'],  // ⚙️
    // 3-byte symbols
    ['c3a2c28fc2b3', 'e28fb3'],    // ⏳
    ['c3a2c28fc2b8', 'e28fb8'],    // ⏸
    ['c3a2e28093c2b6', 'e296b6'],  // ▶
    ['c3a2e28094e280b9', 'e2978b'],// ○
    ['c3a2c593e2809d', 'e29c94'],  // ✔
    ['c3a2c593e280a2', 'e29c95'],  // ✕
    ['c3a2c593e28093', 'e29c96'],  // ✖
    ['c3a2c5a1c2a0', 'e29aa0'],    // ⚠
    ['c3a2c5a1c2a1', 'e29aa1'],    // ⚡
    ['c3a2c593e280a6', 'e29c85'],  // ✅
    ['c3a2c29dc592', 'e29d8c'],    // ❌
    ['c3a2c2adc290', 'e2ad90'],    // ⭐
    ['c3a2e2809ec2b9', 'e284b9'],  // ℹ
    ['c3a2cb9ce280a6', 'e29885'],  // ★
    ['c3a2c2b8c2b8', 'e2b8b8'],    // ⸸
    // Arrows and punctuation
    ['c3a2e280a0e28099', 'e28692'], // →
    ['c3a2e280a0c290', 'e28690'],   // ←
    ['c3a2e282ace2809d', 'e28094'], // —
    ['c3a2e282ace2809c', 'e28093'], // –
    ['c3a2e282acc2a6', 'e280a6'],   // …
    ['c3a2e282acc2ba', 'e280ba'],   // ›
    ['c3a2e282acc2b9', 'e280b9'],   // ‹
    ['c3a2e2809d', 'e2809d'],       // "
    ['c3a2e2809c', 'e2809c'],       // "
    ['c3a2e28099', 'e28099'],       // '
    ['c3a2e28098', 'e28098'],       // '
    // French accented chars
    ['c383c2a9', 'c3a9'],  // é
    ['c383c2a8', 'c3a8'],  // è
    ['c383c2a0', 'c3a0'],  // à
    ['c383c2a2', 'c3a2'],  // â
    ['c383c2ae', 'c3ae'],  // î
    ['c383c2b4', 'c3b4'],  // ô
    ['c383c2bb', 'c3bb'],  // û
    ['c383c2a7', 'c3a7'],  // ç
    ['c383c2ab', 'c3ab'],  // ë
    ['c383c2af', 'c3af'],  // ï
    ['c383c2b9', 'c3b9'],  // ù
    ['c383c2bc', 'c3bc'],  // ü
    ['c383c2aa', 'c3aa'],  // ê
    ['c383e280b0', 'c389'],// É
    ['c383e282ac', 'c380'],// À
    ['c383e280a1', 'c387'],// Ç
    ['c383e2809d', 'c394'],// Ô
    ['c382c2a9', 'c2a9'],  // ©
    ['c382c2b0', 'c2b0'],  // °
    ['c382c2ab', 'c2ab'],  // «
    ['c382c2bb', 'c2bb'],  // »
    ['c382c2a0', 'c2a0'],  // non-breaking space
];

function getAllFiles(dir, exts) {
    let results = [];
    try {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const stat = statSync(full);
            if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
                results = results.concat(getAllFiles(full, exts));
            } else if (exts.includes(extname(full))) {
                results.push(full);
            }
        }
    } catch (e) { }
    return results;
}

const srcDir = './src';
const files = getAllFiles(srcDir, ['.tsx', '.ts', '.jsx', '.js']);
let totalFixed = 0;

console.log(`Scanning ${files.length} files...`);

for (const file of files) {
    let buf = readFileSync(file);
    if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) buf = buf.slice(3);

    let hex = buf.toString('hex');
    const original = hex;

    for (const [broken, fixed] of fixes) {
        while (hex.includes(broken)) {
            hex = hex.split(broken).join(fixed);
        }
    }

    if (hex !== original) {
        writeFileSync(file, Buffer.from(hex, 'hex'));
        console.log('Fixed:', file);
        totalFixed++;
    }
}

console.log(`\nDone! Fixed ${totalFixed} file(s).`);