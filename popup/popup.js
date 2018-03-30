let btn = document.querySelector('#restart');
let btn1 = document.querySelector('#restore');
let tools = document.querySelector('#tools');

btn.addEventListener('click', function (event) {
  chrome.runtime.sendMessage({
    type: 'reboot'
  })
})

btn1.addEventListener('click', function (event) {
  chrome.runtime.sendMessage({
    type: 'restore'
  })
})

tools.addEventListener('click', function (event) {
  chrome.runtime.sendMessage({
    type: 'tools'
  })
})