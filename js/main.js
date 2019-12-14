function makeID(length) {
   let result           = '';
   const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   const charactersLength = characters.length;
   for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

function generateID() {
    $('idField').value = makeID(5);
}

function generateClicked() {
    generateID();
    $('registration').action = 'ignore';
}

function openClicked() {
    $('registration').action = 'sheet.html'
}

(function() {
    const form = $('registration');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.action.endsWith('ignore')) {
            form.action = 'sheet.html?id=' + form.id.value;
            form.submit();
        }
    });
})()


// Utilities
function $(id){ return document.getElementById(id); }
