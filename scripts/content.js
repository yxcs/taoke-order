// 注入
function injectScripts(src) {
  var s = document.createElement("script");
  s.src = chrome.extension.getURL(src);
  s.onload = function() {
    this.remove();
  };
  (document.head || document.documentElement).appendChild(s);
}

injectScripts('scripts/xmlHttp.js')
// injectScripts('scripts/xlsx.js')

let mouseEvent = document.createEvent('MouseEvent');
let clickEvent = document.createEvent('MouseEvent');
let mouseMoveEvent = document.createEvent('MouseEvent');
let username = sessionStorage.getItem('username');
let password = sessionStorage.getItem('password');
let infoReceived = false;

mouseEvent.initMouseEvent('mousedown', true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
clickEvent.initMouseEvent('click', true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
mouseMoveEvent.initMouseEvent('mousemove', true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null)

if (username && password) {
  infoReceived = true;
}

// 如果本地缓存没有用户信息，需要总安全中心拿
chrome.runtime.sendMessage({ type: 'need-userInfo' })

// 获取登录信息
chrome.runtime.onMessage.addListener((req, sender, sendRes) => {
  if (req.type === 'send-userinfo') {
    username = req.username;
    password = req.password;
    sessionStorage.setItem('username', username);
    sessionStorage.setItem('password', password);
    infoReceived = true;
  } else if(req.type === 'generate-excel') {
    // 用于生成excel并下载
    if (location.href.indexOf('?target=generateExcel') !== -1) {
      const pagelist = req.data

      // init filesaver
      var saveAs=saveAs||function(e){"use strict";if(typeof e==="undefined"||typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=t.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in r,a=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},i=/constructor/i.test(e.HTMLElement)||e.safari,f=/CriOS\/[\d]+/.test(navigator.userAgent),u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},s="application/octet-stream",d=1e3*40,c=function(e){var t=function(){if(typeof e==="string"){n().revokeObjectURL(e)}else{e.remove()}};setTimeout(t,d)},l=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var o=e["on"+t[r]];if(typeof o==="function"){try{o.call(e,n||e)}catch(a){u(a)}}}},p=function(e){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)){return new Blob([String.fromCharCode(65279),e],{type:e.type})}return e},v=function(t,u,d){if(!d){t=p(t)}var v=this,w=t.type,m=w===s,y,h=function(){l(v,"writestart progress write writeend".split(" "))},S=function(){if((f||m&&i)&&e.FileReader){var r=new FileReader;r.onloadend=function(){var t=f?r.result:r.result.replace(/^data:[^;]*;/,"data:attachment/file;");var n=e.open(t,"_blank");if(!n)e.location.href=t;t=undefined;v.readyState=v.DONE;h()};r.readAsDataURL(t);v.readyState=v.INIT;return}if(!y){y=n().createObjectURL(t)}if(m){e.location.href=y}else{var o=e.open(y,"_blank");if(!o){e.location.href=y}}v.readyState=v.DONE;h();c(y)};v.readyState=v.INIT;if(o){y=n().createObjectURL(t);setTimeout(function(){r.href=y;r.download=u;a(r);h();c(y);v.readyState=v.DONE});return}S()},w=v.prototype,m=function(e,t,n){return new v(e,t||e.name||"download",n)};if(typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob){return function(e,t,n){t=t||e.name||"download";if(!n){e=p(e)}return navigator.msSaveOrOpenBlob(e,t)}}w.abort=function(){};w.readyState=w.INIT=0;w.WRITING=1;w.DONE=2;w.error=w.onwritestart=w.onprogress=w.onwrite=w.onabort=w.onerror=w.onwriteend=null;return m}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||this.content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!==null){define("FileSaver.js",function(){return saveAs})}

      // init XLSX
      /* xlsx.js (C) 2013-2015 SheetJS -- http://sheetjs.com */



      document.body.innerHTML = `
        <p>已接收到插件传来的数据，正在生成excel，请稍等。。。</p>
      `
    }
  }
})

setTimeout(() => {
  // 爬订单指定页面
  if (location.href.indexOf('/report/zone/zone_self?type=download') !== -1) {
    const currentTime = Date.now()
    const today = new Date(currentTime).toLocaleDateString().replace(/\//g, '-')
    const startDay = new Date(currentTime - 60 * 1000 * 60 * 24 * 3).toLocaleDateString().replace(/\//g, '-')

    // 下载自助推广统计信息的报表链接
    const downStateUrl =
      '/report/selfRpt.json?DownloadID=DOWNLOAD_REPORT_REBORN_DETAIL&adzoneId=&startTime=STARTTIME&endTime=ENDTIME'
      .replace('STARTTIME', startDay)
      .replace('ENDTIME', today);

    // 下载淘宝客推广订单的链接
    const orderUrl =
      '/report/getTbkPaymentDetails.json?queryType=QUERYTYPE&payStatus=PAYSTATUS&DownloadID=DOWNLOAD_REPORT_INCOME_NEW&startTime=STARTTIME&endTime=ENDTIME'
      .replace('STARTTIME', startDay)
      .replace('ENDTIME', today);
    // 全量订单
    const downAllOrderUrl =
      orderUrl
      .replace('QUERYTYPE', 1)
      .replace('PAYSTATUS', '');
    // 结算订单
    const downFinishedOrderUrl =
      orderUrl
      .replace('QUERYTYPE', 3)
      .replace('PAYSTATUS', 3);
    // 失效订单
    const downAbatedOrderUrl =
      orderUrl
      .replace('QUERYTYPE', 1)
      .replace('PAYSTATUS', 13);

    // 下载第三方服务商推广的订单
    const thirdOrderUrl =
      '/report/getTbkThirdPaymentDetails.json?queryType=QUERYTYPE&payStatus=PAYSTATUS&DownloadID=DOWNLOAD_REPORT_TK3_PUB&startTime=STARTTIME&endTime=ENDTIME'
      .replace('STARTTIME', startDay)
      .replace('ENDTIME', today);
    // 全量订单
    const downThirdAllOrderUrl =
      thirdOrderUrl
      .replace('QUERYTYPE', 2)
      .replace('PAYSTATUS', '');
    // 结算订单
    const downThirdFinishedOrderUrl =
      thirdOrderUrl
      .replace('QUERYTYPE', 4)
      .replace('PAYSTATUS', 3);
    // 失效订单
    const downThirdAbatedOrderUrl =
      thirdOrderUrl
      .replace('QUERYTYPE', 2)
      .replace('PAYSTATUS', 13);

    setTimeout(() => {
      // 清空hmtl
      document.body.innerHTML = `
        <div>
          <p style="color: black;font-weight: bold;font-size: 32px;">${document.querySelector('#J_menu_product .menu-username').textContent}</p>
          <p style="color: red; font-size: 26px;">该窗口是爬取订单专用，勿动。如果不小心关了也不要紧（你也关不掉）</p>
          <p style="color: green;">建议你从这里新开窗口进入</p>
          <img src="data:image/png;base64,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" title="点击任务栏chrome浏览器小图标，点击对应的插件账号进入"/>
        </div>
        <div><a id="downState" href="${downStateUrl}">自助推广报表</a></div>
        <div><a id="downAllOrder" href="${downAllOrderUrl}">淘宝客推广全部订单报表</a></div>
        <div><a id="downFinishedOrder" href="${downFinishedOrderUrl}">淘宝客推广结算订单报表</a></div>
        <div><a id="downAbatedOrder" href="${downAbatedOrderUrl}">淘宝客推广失效订单报表</a></div>
        <div><a id="downThirdAllOrder" href="${downThirdAllOrderUrl}">第三方服务商推广全部订单报表</a></div>
        <div><a id="downThirdFinishedOrder" href="${downThirdFinishedOrderUrl}">第三方服务商推广结算订单报表</a></div>
        <div><a id="downThirdAbatedOrder" href="${downThirdAbatedOrderUrl}">第三方服务商推广失效订单报表</a></div>
      `
    }, 30 * 1000)

    function downloadFiles() {
      // 推广报表
      setTimeout(() => {
        if (document.querySelector('#downState')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downState').click();
        } else {
          document.body.innerHTML += `<div><a id="downState" href="${downStateUrl}">自助推广报表</a></div>`
        }
      }, 0)
      // 下载全部淘客订单
      setTimeout(() => {
        if (document.querySelector('#downAllOrder')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downAllOrder').click();
        } else {
          document.body.innerHTML += `<div><a id="downAllOrder" href="${downAllOrderUrl}">淘宝客推广全部订单报表</a></div>`
        }
      }, (30 + Math.floor(Math.random() * 10)) * 1000)
      // 偏移3min下载全部第三方服务商订单
      setTimeout(() => {
        if (document.querySelector('#downThirdAllOrder')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downThirdAllOrder').click();
        } else {
          document.body.innerHTML += `<div><a id="downThirdAllOrder" href="${downThirdAllOrderUrl}">第三方服务商推广全部订单报表</a></div>`
        }
      }, (2 * 60 + Math.floor(Math.random() * 60)) * 1000)
      // 偏移3min下载淘宝客结算订单
      setTimeout(() => {
        if (document.querySelector('#downFinishedOrder')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downFinishedOrder').click();
        } else {
          document.body.innerHTML += `<div><a id="downFinishedOrder" href="${downFinishedOrderUrl}">淘宝客推广结算订单报表</a></div>`
        }
      }, (5 * 60 + Math.floor(Math.random() * 60)) * 1000)

      // 2分钟后下载第三方服务商结算订单
      setTimeout(() => {
        if (document.querySelector('#downThirdFinishedOrder')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downThirdFinishedOrder').click();
        } else {
          document.body.innerHTML += `<div><a id="downThirdFinishedOrder" href="${downThirdFinishedOrderUrl}">第三方服务商推广结算订单报表</a></div>`
        }
      }, (7 * 60 + Math.floor(Math.random() * 60)) * 1000)
      // 偏移3min下载淘宝客失效订单
      setTimeout(() => {
        if (document.querySelector('#downAbatedOrder')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downAbatedOrder').click();
        } else {
          document.body.innerHTML += `<div><a id="downAbatedOrder" href="${downAbatedOrderUrl}">淘宝客推广失效订单报表</a></div>`
        }
      }, (10 * 60 + Math.floor(Math.random() * 60)) * 1000)
      // 偏移3min下载第三方服务商失效订单
      setTimeout(() => {
        if (document.querySelector('#downThirdAbatedOrder')) {
          location.href.indexOf('/report/zone/zone_self?type=download') !== -1 &&
            document.querySelector('#downThirdAbatedOrder').click();
        } else {
          document.body.innerHTML += `<div><a id="downThirdAbatedOrder" href="${downThirdAbatedOrderUrl}">第三方服务商推广失效订单报表</a></div>`
        }
      }, (13 + Math.floor(Math.random() * 60)) * 60 * 1000)
      // 偏移2min去刷新session
      setTimeout(() => {
        chrome.runtime.sendMessage({type: 'reload-session'})
      }, (15 + Math.floor(Math.random() * 60)) * 60 * 1000)
    }

    // 让子弹飞一会儿
    const intervalId = setInterval(() => {
      if (location.href.indexOf('/report/zone/zone_self?type=download') !== -1) {
        clearInterval(intervalId)
        downloadFiles()
      }
    }, 1000)
  }
}, 5000)

  // 维持登录
  // if (location.href.indexOf(`http://pub.alimama.com/myunion.htm?spm=${localStorage.getItem('spm')}`) !== -1) {
  //   let intervalId = setInterval(_ => {
  //     let btn = document.querySelector('.close');
  //     let messageTrigger = document.querySelector('.message-trigger');
  //     let travel = (mouseEvent, clickEvent) => {
  //       // 走一遍页面
  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/myunion/overview"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/myunion/overview"]').dispatchEvent(clickEvent)
  //       }, 1000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/myunion/message"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/myunion/message"]').dispatchEvent(clickEvent)
  //       }, 2000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/self/items"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/self/items"]').dispatchEvent(clickEvent)
  //       }, 3000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/self/links"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/self/links"]').dispatchEvent(clickEvent)
  //       }, 4000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/taobao/widget_publish"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/taobao/widget_publish"]').dispatchEvent(clickEvent)
  //       }, 5000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/taobao/coupon"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/taobao/coupon"]').dispatchEvent(clickEvent)
  //       }, 6000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/taobao/software"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/taobao/software"]').dispatchEvent(clickEvent)
  //       }, 7000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/act/activity"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/act/activity"]').dispatchEvent(clickEvent)
  //       }, 8000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/act/activity_seller"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/act/activity_seller"]').dispatchEvent(clickEvent)
  //       }, 9000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/act/activity_cpa"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/act/activity_cpa"]').dispatchEvent(clickEvent)
  //       }, 10000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/extra/aliyun"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/extra/aliyun"]').dispatchEvent(clickEvent)
  //       }, 11000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/promo/extra/alitrip"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/promo/extra/alitrip"]').dispatchEvent(clickEvent)
  //       }, 12000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/manage/site/site"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/manage/site/site"]').dispatchEvent(clickEvent)
  //       }, 13000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/manage/zone/zone"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/manage/zone/zone"]').dispatchEvent(clickEvent)
  //       }, 14000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/manage/channel/channel"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/manage/channel/channel"]').dispatchEvent(clickEvent)
  //       }, 15000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/manage/campaign/campaign"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/manage/campaign/campaign"]').dispatchEvent(clickEvent)
  //       }, 16000)

  //       setTimeout(_ => {
  //         document.querySelector('[href="#!/manage/software/list"]').dispatchEvent(mouseEvent)
  //         document.querySelector('[href="#!/manage/software/list"]').dispatchEvent(clickEvent)
  //       }, 17000)
  //     }
  //     if (btn) {
  //       clearInterval(intervalId);
  //       let mouseEvent = document.createEvent('MouseEvent');
  //       mouseEvent.initMouseEvent('mousedown', true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null)

  //       // 隐藏公告
  //       btn.dispatchEvent(mouseEvent);

  //       setTimeout(_ => {
  //         travel(mouseEvent, clickEvent)
  //       }, 10000)
  //     } else if (messageTrigger) {
  //       clearInterval(intervalId);

  //       // 展现公告
  //       messageTrigger.dispatchEvent(mouseEvent);
  //       messageTrigger.dispatchEvent(clickEvent);

  //       setTimeout(_ => {
  //         travel(mouseEvent, clickEvent)
  //       }, 10000)
  //     }

  //   }, 500);
  // }

// 当跳转到阿里妈妈首页时，获取并设置spm
if (location.href === 'https://pub.alimama.com/' ||
location.href === 'http://pub.alimama.com/') {
  let intervalId = setInterval(_ => {
    let btn = document.querySelector('a.login-enter');
    if (btn) {
      clearInterval(intervalId);
      btn.onclick = function (e) {
        let nextHref = e.target.href;
        let spm = nextHref.split('?spm=')[1];
        localStorage.setItem('spm', spm);
        chrome.runtime.sendMessage({type: 'login-succeed', spm});
      }

      // 模拟mousedown事件，生成spm
      let mouseEvent = document.createEvent('MouseEvent')
      mouseEvent.initMouseEvent('mousedown', true, true, document.defaultView, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
      btn.dispatchEvent(mouseEvent);
      setTimeout(_ => {
        btn.click();
      }, 1500)
    }
  }, 2000);
}

if (location.href.indexOf('login.taobao.com/member/login.jhtml') !== -1) {
  let passwordEle = null;
  let usernameEle = null;
  let loginBtn = null;
  // let passwordInput = null;
  // 自检是否已经滑动验证失败了
  setInterval(() => {
    if (document.querySelector('.errloading')) {
      chrome.runtime.sendMessage({type: 'scroll-failed'});
    }
  }, 100)
  let loginBtnInterval = setInterval(() => {

    // 登录按钮是否加载完成
    loginBtn = document.querySelector('#J_SubmitStatic');
    if (loginBtn) {
      clearInterval(loginBtnInterval);
      loginBtn.textContent = '自动登录中，请稍等...';
      loginBtn.disabled = false;

      // 判断用户名和密码输入框是否渲染完成
      let inputInterval = setInterval(() => {
        passwordEle = document.querySelector('#TPL_password_1');
        usernameEle = document.querySelector('#TPL_username_1');
        loginBtn.onclick = function () {
          password = passwordEle.value;
          username = usernameEle.value;
          chrome.runtime.sendMessage({type: 'get-userinfo', username, password});
        }
        if (passwordEle && usernameEle && infoReceived) {
          clearInterval(inputInterval);

          // 判断是否有滑动验证组件,
          // 如果没有滑动验证组件，直接登录
          if (
            window.getComputedStyle(
              document.querySelector('#nocaptcha')
            ).display === 'none') {
            passwordEle.value = password;
            usernameEle.value = username;
            loginBtn.textContent = `登    录`;
            loginBtn.disabled = false;
            setTimeout(() => {
              document.querySelector('#J_SubmitStatic').click();
            }, 2000)
          } else {

            // 尝试修改localStorage，滑块校验貌似与这个有关
            // 这一组是写死的，因为这一组值可以让滑块校验通过
            // resetLocalStorage()

            // 如果有滑动验证组件，先改名，方便通过滑动验证
            passwordEle.value = password;
            usernameEle.value = username + new Date().getMilliseconds();

            // 开始滑动验证逻辑
            let btn = document.querySelector('#nc_1_n1z');
            let bg = document.querySelector('#nc_1__bg');

            // 通知background清空当前域缓存
            // chrome.runtime.sendMessage({type: 'clear-cookie'})

            // 清除cookie后滑动滑块
            setTimeout(_ => {
              let mouseDownStart = new MouseEvent('mousedown', {
                clientX: 800,
                clientY: 400,
                view: window,
                buttons: 1,
                button: 0,
                bubbles: true,
                cancelable: true
              })

              // reset，因为淘宝登录页对这个值的设置有interval更新
              // resetLocalStorage()
              let mouseDown = new MouseEvent('mousedown', {
                clientX: 800,
                clientY: 400,
                view: window,
                buttons: 1,
                button: 0,
                bubbles: true,
                cancelable: true
              })

              // reset，因为淘宝登录页对这个值的设置有interval更新
              // resetLocalStorage()
              let mouseMove = new MouseEvent('mousemove', {
                clientX: 800,
                clientY: 400,
                view: window,
                buttons: 1,
                button: 0,
                bubbles: true,
                cancelable: true
              })

              btn.dispatchEvent(mouseDownStart);
              document.dispatchEvent(mouseMove);

              setTimeout(() => {
                btn.style.left = '50px';
                bg.style.width = '50px';
              }, 1000)

              setTimeout(() => {
                btn.style.left = '80px';
                bg.style.width = '80px';
              }, 1500)

              setTimeout(() => {
                btn.style.left = '120px';
                bg.style.width = '120px';
              }, 2000)

              setTimeout(() => {
                btn.style.left = '170px';
                bg.style.width = '170px';
              }, 2500)

              setTimeout(() => {
                btn.style.left = '190px';
                bg.style.width = '190px';
              }, 3000)

              setTimeout(() => {
                btn.style.left = '200px';
                bg.style.width = '200px';
              }, 3500)

              setTimeout(() => {
                btn.style.left = '210px';
                bg.style.width = '210px';
              }, 4000)

              setTimeout(() => {
                btn.dispatchEvent(mouseDown);
                document.dispatchEvent(mouseMove);
              }, 4500);

              setTimeout(() => {
                // resetLocalStorage()
                // resetLocalStorage()
                loginBtn.disabled = false;
                loginBtn.textContent = `登    录`;

                // 改回正确昵称
                setTimeout(() => {
                  usernameEle.value = username;

                  setTimeout(() => {
                    // resetLocalStorage()
                    document.querySelector('#J_SubmitStatic').click();
                  }, 2000)
                }, 2000)
              }, 5000)
            }, 1000)
          }
        }
      }, 200)
    }
  }, 200);

  // 如果3分钟都还没有登录完，重刷页面
  setTimeout(() => {
    location.reload(true)
  }, 60 * 1000 * 3)
} else {
  // 加几秒的延迟，以免登录信息还未加载出来导致误判
  setTimeout(() => {
    if (
      (document.querySelector('.login-panel') || document.querySelector('#J_LoginBox')) &&
      location.href.indexOf('www.alimama.com/500.htm') === -1 &&
      ['/member/login.htm', '/member/login.jhtml'].indexOf(location.pathname) !== -1 &&
      location.search.indexOf('style=minisimple') === -1) {
      location.href = 'https://login.taobao.com/member/login.jhtml?style=minisimple&from=alimama&redirectURL=http://login.taobao.com/member/taobaoke/login.htm?is_login=1&full_redirect=true&c_isScure=true&quicklogin=true'
    }
  }, 6000)
}

// 用于进行恢复数据，不影响其他任务
if(location.href.indexOf('/report/detail/taoke?for=update') > 0) {
  let _tb_token_ = '';
  let startTime = '';
  let endTime = '';
  let abateStart = '';
  let queryType = 1;
  let day = 0;
  let month = 0;
  let year = 0;
  let req = null;
  let downloadBtn = null;
  let isForUpdate = false;
  let startRstTime = null;

  console.log('for=update')
  // 只能够获取最近90天的表单
  startRstTime = new Date('2017.10.19 0:0:0');
  let findBtnInterval = setInterval(() => {
    if (downloadBtn) {
      clearInterval(findBtnInterval);
      let newDownloadBtn = downloadBtn.cloneNode();
      let abateDownloadBtn = downloadBtn.cloneNode();  // 失效按钮
      let parent = downloadBtn.parentNode;
      parent.insertBefore(newDownloadBtn, downloadBtn);
      parent.insertBefore(abateDownloadBtn, downloadBtn);

      // 开始恢复数据，30s下载一天数据
      let rstInterval = setInterval(_ => {
        updateDate();
        // 判断数据恢复是否完成
        if ( new Date(startRstTime).getTime() >= new Date('2017.11.10 0:0:0') ) {
          clearInterval(rstInterval);
          console.log('数据恢复已结束');
        } else {
          console.log(startTime)
          // 结算
          newDownloadBtn.href = `/report/getTbkPaymentDetails.json?queryType=3&payStatus=3&DownloadID=DOWNLOAD_REPORT_INCOME_NEW&startTime=${startTime}&endTime=${startTime}`;
          downloadBtn.href = `/report/getTbkPaymentDetails.json?queryType=1&payStatus=&DownloadID=DOWNLOAD_REPORT_INCOME_NEW&startTime=${startTime}&endTime=${startTime}`;
          abateDownloadBtn.href = `/report/getTbkPaymentDetails.json?queryType=1&payStatus=13&DownloadID=DOWNLOAD_REPORT_INCOME_NEW&startTime=${startTime}&endTime=${startTime}`;
          setTimeout(_ => {
            newDownloadBtn.click();
          }, 1000);
          // 恢复暂时只爬结算的
          // setTimeout(_ => {
          //   abateDownloadBtn.click();
          // }, 2000);
          // downloadBtn.click();
        }
      }, 30000);
    } else {
      downloadBtn = document.querySelector('[title="下载报表"]');
    }
  }, 500);

  let updateDate = () => {
    let endDate = new Date();
    let startDate = startRstTime;
    let endYear = endDate.getFullYear();
    let startYear = startDate.getFullYear();
    let endMonth = endDate.getMonth() + 1;
    let startMonth = startDate.getMonth() + 1;
    let endDay = endDate.getDate();
    let startDay = startDate.getDate();
    if (endMonth < 10) {
      endMonth = '0' + endMonth.toString();
    }
    if (startMonth < 10) {
      startMonth = '0' + startMonth.toString();
    }
    if (endDay < 10) {
      endDay = '0' + endDay.toString();
    }
    if (startDay < 10) {
      startDay = '0' + startDay.toString();
    }
    endTime = endYear + '-' + endMonth + '-' + endDay;
    startTime = startYear + '-' + startMonth + '-' + startDay;
    startRstTime = new Date(startRstTime.getTime() + 60 * 1000 * 60 * 24);
    console.log(startRstTime.toLocaleString());
  }
}

/**
 *
 * @desc
 * @param {number} timeLog
 * @returns
 */
function delay (timeLog) {
  return new Promise((resolve) => {
    setTimeout(function() {
      resolve()
    }, timeLog);
  })
}

function resetLocalStorage () {
  localStorage.setItem('_umcost', '1823')
  localStorage.setItem('_umdata', "55F3A8BFC9C50DDAD984FBB8E9A5DC24F62236015DFF331938DA8962865764E92D86CA9DE876323CCD43AD3E795C914CEC9337B5B9455AE60CF2CD5F9F322E57")
  localStorage.setItem('_umtk', "{'t':1503381291747,'tk':'HV01PAAZ0b8712653cbf4612599bc72b002c0bfb'}")
}

// to fuck the ali's network limitation
if (location.href.indexOf('alisec.alimama.com/checkcodev3') !== -1) {
  let unlockId = setInterval(() => {
    let btn = document.querySelector('#nc_1_n1z');
    let bg = document.querySelector('#nc_1__bg');
    if (btn && bg) {
      clearInterval(unlockId)
      setTimeout(_ => {
        let mouseDownStart = new MouseEvent('mousedown', {
          clientX: 800,
          clientY: 400,
          view: window,
          buttons: 1,
          button: 0,
          bubbles: true,
          cancelable: true
        })

        // reset，因为淘宝登录页对这个值的设置有interval更新
        // resetLocalStorage()
        let mouseDown = new MouseEvent('mousedown', {
          clientX: 800,
          clientY: 400,
          view: window,
          buttons: 1,
          button: 0,
          bubbles: true,
          cancelable: true
        })

        // reset，因为淘宝登录页对这个值的设置有interval更新
        // resetLocalStorage()
        let mouseMove = new MouseEvent('mousemove', {
          clientX: 800,
          clientY: 400,
          view: window,
          buttons: 1,
          button: 0,
          bubbles: true,
          cancelable: true
        })

        btn.dispatchEvent(mouseDownStart);

        document.dispatchEvent(mouseMove);

        setTimeout(() => {
          btn.style.left = '58px';
          bg.style.width = '58px';
        }, 500)


        setTimeout(() => {
          btn.style.left = '100px';
          bg.style.width = '100px';
        }, 1000)

        setTimeout(() => {
          btn.style.left = '120px';
          bg.style.width = '120px';
        }, 1500)

        setTimeout(() => {
          btn.style.left = '158px';
          bg.style.width = '158px';
        }, 2000)

        setTimeout(() => {
          btn.style.left = '200px';
          bg.style.width = '200px';
        }, 2500)

        setTimeout(() => {
          btn.style.left = '220px';
          bg.style.width = '220px';
        }, 3000)

        setTimeout(() => {
          btn.style.left = '230px';
          bg.style.width = '230px';
        }, 3500)

        setTimeout(() => {
          btn.style.left = '258px';
          bg.style.width = '258px';
        }, 4000)

        setTimeout(() => {
          btn.dispatchEvent(mouseDown);
          document.dispatchEvent(mouseMove);
        }, 4500)
      }, 1500)
    }
  }, 500)
  // 验证失败后1min后重开
  setTimeout(() => {
    chrome.runtime.sendMessage({type: 'close-tab'})
  }, 60 * 1 * 1000)
}

// start auth
if (location.href.indexOf('oauth.taobao.com/authorize') !== -1) {
  let button = null
  let subBtnInterval = setInterval(() => {
    button = document.querySelector('#sub')
    if (button) {
      clearInterval(subBtnInterval)
      button.click()
    }
  }, 500)
}