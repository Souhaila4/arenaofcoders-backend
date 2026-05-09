const regex = /^https?:\/\/(?:www\.)?github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/]+))?(?:\/.*)?(?:\.git)?$/i;
const url = 'https://github.com/Souhaila4/arenaofcodersfrontend-mobile/tree/kaboura';
console.log(url.match(regex));
