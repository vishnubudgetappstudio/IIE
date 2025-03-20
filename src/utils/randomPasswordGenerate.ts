export const generateRandomPassword = (length = 12) => {
    const charset =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+";
    const passwordArray = new Uint8Array(length);
    const crypto = globalThis.crypto || require("crypto").webcrypto; // Works in Browser & Node.js

    crypto.getRandomValues(passwordArray);

    return Array.from(passwordArray, (byte) => charset[byte % charset.length]).join("");
};

// console.log(generateRandomPassword()); // Example: "A$7kLp!9&bZ2@TgM"
