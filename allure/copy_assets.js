const fs = require('fs');
const path = require('path');

const srcFile = "C:/Users/tatui/.gemini/antigravity/brain/61c14cdf-0e24-4262-9cf4-de61978449e4/.user_uploaded/media_1787773971006.png";

const destinations = [
  path.join(__dirname, 'src', 'assets', 'logo-header.png'),
  path.join(__dirname, 'src', 'assets', 'logo-login.png'),
  path.join(__dirname, 'public', 'logo-header.png'),
  path.join(__dirname, 'public', 'logo-login.png')
];

destinations.forEach(dest => {
  fs.copyFileSync(srcFile, dest);
  console.log(`Copied to ${dest}`);
});

