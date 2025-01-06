const escapeForHTML = (str) => {
  return str
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/&/g, '&');
};


const addCommas = (n) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

module.exports = {
  escapeForHTML,
   addCommas
}
