let taokeId = null;
let resetId = null;
let stateId = null;
let rightId = null;
let alimamaId = null;
let loginId = null;
let thirdId = null;
let taokeTimeout = null;
let stateTimeout = null;
let stateInterval = null;
let alimamaTimeout = null;
let loginTimeout = null;
let thirdTimeout = null;
let rightTimeout = null;
let loginTime = 0;
let retry = 0;
let autoReloadId = null;
let lastOrderImportTime = Date.now();
const accountCode = 86

// 请求通知权限
if (Notification.permission !== 'granted') {
  Notification.requestPermission();
}

// 每22个小时自动重启
// setInterval(_ => {
//   reboot('AUTO');
//   console.log(`${new Date().toLocaleString()} 重启调用`);
// }, 60 * 60 * 1000 * 12)

// 尝试新的保持登录策略，每10分钟访问一次http://pub.alimama.com/myunion.htm，如果跳转
// 登录页，则走自动登录逻辑
setInterval(() => {
  chrome.tabs.create({
    url: 'http://pub.alimama.com/myunion.htm'
  }, tab => {
    // 5分钟之后，干掉页面
    setTimeout((tab) => {
      chrome.tabs.remove(tab.id)
    }, 60 * 1000 * 5, tab)
  })
}, 60 * 1000 * 10)

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'login-succeed') {
    if (message.spm) {
      localStorage.setItem('spm', message.spm);
      !stateId && openStateWin();
      // chrome订单本地监控，协同node端的二次校验
      if (stateInterval) {
        clearInterval(stateInterval)
      }
      stateInterval = setInterval(() => {
        // 已经超时，需要重新打开
        if (Date.now() - lastOrderImportTime > 1000 * 60 * 30) {
          clearTimeout(stateTimeout);
          openStateWin();
        }
      }, 1000 * 60)
      if (localStorage.getItem('target') && localStorage.getItem('sign_account')) {
        !alimamaId && new Notification('爬订单插件初始化成功！');
        if (localStorage.getItem('username') && localStorage.getItem('password')) {
          new Notification('已成功抓取用户信息，插件将开启自动登录！')
          // 登录成功之后，清空后续的因为滑动验证失败而触发的30‘后的自动重启
          autoReloadId && clearTimeout(autoReloadId)
          autoReloadId = null
          loginTime = Date.now();
          retry = 0;

          // 关掉其他所有页面
          setTimeout(() => {
            chrome.tabs.query({
              url: '<all_urls>'
            }, tabs => {
              let extensionIndex = -1;
              tabs.forEach((tab, index) => {
                if (tab.url.indexOf('chrome://extensions') !== -1) {
                  extensionIndex = index;
                }
              })
              tabs.splice(extensionIndex, 1);
              tabs.forEach(tab => {
                if (tab.id !== taokeId &&
                  tab.id !== stateId &&
                  tab.id !== alimamaId &&
                  tab.id !== thirdId &&
                  tab.id !== rightId &&
                  tab.id !== loginId &&
                  tab.id !== resetId &&
                  tab.id !== thirdId ) {
                  if (tab.url.indexOf('background/index.html') === -1 &&
                    tab.url.indexOf('background/export.html') === -1 &&
                    tab.url.indexOf('background/') === -1 &&
                    tab.url.indexOf('background/create.html') === -1) {
                    chrome.tabs.remove(tab.id)
                  }
                }
              })
              // 开始自动授权，首先校验本地是否有上一次的自动授权的记录
              // 校验授权记录是否是否已经超过20天 3600 * 1000 * 24 * 20
              const lastAuthTime = parseInt(localStorage.getItem('authTime') || -1)
              if ((!lastAuthTime || (Date.now() - lastAuthTime > 3600 * 1000 * 24 * 27)) && accountCode > 0) {
                chrome.tabs.create({
                  url: `http://open.xuanwonainiu.com/auth/acc/token/${accountCode}`
                })
              }
            })
          }, 1000)
        } else {
          new Notification('未成功抓取用户信息，插件无法开启自动登录！可以重启插件，重新登录。')
        }
      } else {
        !alimamaId && new Notification('爬订单插件初始化失败！请重启插件重新登陆http://pub.alimama.com')
      }
      if (!alimamaId) {
        openAlimamaWin();
      }
    }
  } else if (message.type === 'reboot') {
    reboot('BY_HAND');
  } else if (message.type === 'restore') {
    openTbkWinRestore()
  } else if (message.type === 'tools') {
    // 打开工具箱
    chrome.windows.create({
      width: 1088,
      height: 869,
      top: 110,
      left: 240,
      url: `background/index.html`,
      type: 'normal'
    }, function (window) {
      localStorage.setItem('toolWinId', window.id)
    })
  } else if (message.type === 'get-userinfo') {
    !localStorage.getItem('username') &&
      localStorage.setItem('username', message.username);
    !localStorage.getItem('password') &&
      localStorage.setItem('password', message.password);
  } else if (message.type === 'clear-cookie') {
    clearCookies('https://*.taobao.com')
    clearCookies('http://login.taobao.com/member')
    clearCookies('https://g.alicdn.com/alilog/oneplus')
  } else if (message.type === 'close-tab') {
    chrome.tabs.remove(sender.tab.id)
  } else if (message.type === 'reload-session') {
    alimamaId = null
    clearTimeout(alimamaTimeout);
    openAlimamaWin();
  } else if (message.type === 'scroll-failed') {
    // 关掉滑动验证登录页面
    chrome.tabs.query({
      url: 'https://login.taobao.com/member/login.jhtm*'
    }, tabs => {
      tabs.forEach(tab => {
        chrome.tabs.remove(tab.id)
      })
    })
    if (autoReloadId === null) {
      // 停15'尝试重启登录
      autoReloadId = setTimeout(() => {
        autoReloadId = null;
        reboot('BY_HAND');
      }, 15 * 60 * 1000);
    }
  } else if (message.type === 'need-userInfo') {
    chrome.tabs.sendMessage(sender.tab.id, {
      type: 'send-userinfo',
      username: localStorage.getItem('username'),
      password: localStorage.getItem('password')
    })
  }
})

chrome.webRequest.onBeforeRequest.addListener(details => {
  if (details.url.split('?').length === 2) {
    if (details.url.indexOf('login.taobao.com/aso/tgs') !== -1) {
      let obj = parseUrlToObj(details.url.split('?')[1]);
      obj.sign_account && localStorage.setItem('sign_account', obj.sign_account);
      obj.target && localStorage.setItem('target', obj.target);
      // 开启pub.alimama.com
      setTimeout(_ => {
        !loginTime && chrome.tabs.create({
          url: 'http://pub.alimama.com'
        });
      }, 20000)
    } else if (details.url.indexOf('open.xuanwonainiu.com/auth/acc/code') !== -1) {
      let obj = parseUrlToObj(details.url.split('?')[1]);
      // 操作账号相同认为授权成功
      if (parseInt(obj.state) === accountCode) {
        // 写入缓存
        localStorage.setItem('authTime', Date.now())
        // 关掉页面
        setTimeout(() => {
          chrome.tabs.query({
            url: 'http://open.xuanwonainiu.com/*',
          }, tabs => {
            tabs.forEach(tab => {
              chrome.tabs.remove(tab.id)
            })
          })
        }, 1000)
      }
    }
  }
}, {
  urls: [
    'https://login.taobao.com/*',
    'http://open.xuanwonainiu.com/auth/acc/*',
  ]
})


chrome.windows.onRemoved.addListener((tabId) => {
  if (tabId === taokeId) {
    clearTimeout(taokeTimeout);
    openTbkWin();
  } else if (tabId === stateId) {
    clearTimeout(stateTimeout);
    openStateWin();
  }else if (tabId === rightId) {
    clearTimeout(rightTimeout);
    openRightsWin();
  } else if (tabId === alimamaId) {
    clearTimeout(alimamaTimeout);
    // openAlimamaWin();
  } else if (tabId === resetId) {
    // openResetData();
  } else if (tabId === thirdId) {

    // 第三方服务商窗口关闭，开启淘宝客订单窗口
    clearTimeout(thirdTimeout);
    openTbkWin();
  } else if (tabId === loginId && alimamaId === null) {
    clearTimeout(loginTimeout);
    openAlimamaWin();
  }
});

function reboot (type) {
  loginTime = 0;
  if (type === 'BY_HAND') {
    // 重启相关操作
    // 关闭所有阿里妈妈页面
    chrome.tabs.query({
      url: '<all_urls>'
    }, tabs => {
      clearTimeout(taokeTimeout);
      clearTimeout(stateTimeout);
      clearTimeout(alimamaTimeout);
      clearTimeout(thirdTimeout);
      clearTimeout(loginTimeout);
      clearTimeout(alimamaTimeout);
      taokeId = null;
      taokeTimeout = null;
      stateId = null;
      rightId = null;
      stateTimeout = null;
      alimamaId = null;
      alimamaTimeout = null;
      thirdId = null;
      thirdTimeout = null;
      alimamaTimeout = null;
      loginTimeout = null;
      loginId = null;
      alimamaId = null;
      tabs.forEach(item => {
        if (
          item.url.indexOf('background/index.html') === -1 &&
          item.url.indexOf('background/export.html') === -1 &&
          item.url.indexOf('background/') === -1 &&
          item.url.indexOf('background/create.html') === -1
        ) {
          chrome.tabs.remove(item.id)
        }
      })
      // 关掉爬数据的三个小窗-
      alimamaId = null;
    })

    // 新开一个页面用来账号登陆
    chrome.windows.create({
      url: 'chrome://extensions/',
      top: 0,
      left: 0,
      width: 800,
      height: 800,
      focused: false
    }, _ => {
      setTimeout(() => {
        chrome.tabs.create({
          url: 'http://www.alimama.com/member/logout.htm?forward=http://pub.alimama.com/'
        }, logoutTab => {
          setTimeout(_ => {
            chrome.tabs.create({
              url: 'https://login.taobao.com/member/login.jhtml?style=minisimple&from=alimama&redirectURL=http://login.taobao.com/member/taobaoke/login.htm?is_login=1&full_redirect=true&c_isScure=true&quicklogin=true'
            }, loginTab => {
              setTimeout(_ => {
                chrome.tabs.sendMessage(loginTab.id, {
                  type: 'send-userinfo',
                  username: localStorage.getItem('username'),
                  password: localStorage.getItem('password')
                })
              }, 10000)
            })
            chrome.tabs.remove(logoutTab.id)
          }, 2000)
        })
      }, 2000)
    });
  } else if (type === 'AUTO') {

    // 新开一个页面用来账号登陆
    chrome.windows.create({
      url: 'chrome://extensions/',
      top: 0,
      left: 0,
      width: 800,
      height: 800,
      focused: false
    }, _ => {
      chrome.tabs.create({
        url: 'http://www.alimama.com/member/logout.htm?forward=http://pub.alimama.com/'
      }, logoutTab => {
        setTimeout(_ => {
          chrome.tabs.create({
            url: 'https://login.taobao.com/member/login.jhtml?style=minisimple&from=alimama&redirectURL=http://login.taobao.com/member/taobaoke/login.htm?is_login=1&full_redirect=true&c_isScure=true&quicklogin=true'
          }, loginTab => {
            setTimeout(_ => {
              chrome.tabs.sendMessage(loginTab.id, {
                type: 'send-userinfo',
                username: localStorage.getItem('username'),
                password: localStorage.getItem('password')
              })
            }, 10000)
          })
          chrome.tabs.remove(logoutTab.id)
        }, 2000)
      })
    });
  }

  // 10分钟后自检，登录是否成功，安全起见，自检重启只重试一次
  if (retry === 0) {
    setTimeout(() => {
      if (loginTime === 0) {
        reboot('BY_HAND');
      }
    }, 10 * 60 * 1000)
    retry++;
  }
}

function getSpm () {
  if (localStorage.getItem('spm')) {
    return localStorage.getItem('spm');
  } else {
    return '';
  }
}

function parseUrlToObj (search) {
  let obj = {};
  let objArr = search.split('&');
  objArr.forEach(item => {
    let params = item.split('=');
    if (params.length === 2) {
      obj[params[0]] = params[1];
    }
  })
  return obj;
}

// 淘客推广订单
function openTbkWin () {
  chrome.windows.create({
    focused: false,
    width: 10,
    height: 10,
    top: 580,
    left: 0,
    url: `http://pub.alimama.com/myunion.htm?spm=${getSpm()}#!/report/detail/taoke`,
    type: 'popup'
  }, window => {
    taokeId = window.id;

    // 15min后reload窗口
    taokeTimeout = setTimeout(_ => {
      chrome.windows.remove(taokeId);
    }, 15 * 1000 * 60);
  });
}

function clearCookies (domain) {
  chrome.cookies.getAll({url: domain}, cookies => {
    cookies && cookies.forEach(item => {
      console.log(item.name);
      chrome.cookies.remove({
        name: item.name,
        url: domain
      })
    })
  })
}

function openTbkWinRestore () {
  chrome.windows.create({
    width: 10,
    height: 10,
    top: 300,
    left: 600,
    url: `http://pub.alimama.com/myunion.htm?spm=${getSpm()}#!/report/detail/taoke?for=update`,
    type: 'popup'
  }, window => {
    taokeId = window.id;
  });
}

function openResetData () {
  chrome.windows.create({
    width: 10,
    height: 10,
    top: 580,
    left: 600,
    url: `http://pub.alimama.com/myunion.htm?spm=${getSpm()}#!/report/detail/taoke?for=update`,
    type: 'popup'
  }, window => {
    resetId = window.id;
  });
}

// 自助推广
function openStateWin () {
  chrome.windows.create({
    width: 10,
    height: 10,
    top: 420,
    left: 0,
    url: `http://pub.alimama.com/myunion.htm?spm=${getSpm()}#!/report/zone/zone_self?type=download`,
    type: 'popup'
  }, window => {
    const originId = stateId
    stateId = window.id;
    chrome.windows.remove(originId)
    lastOrderImportTime = Date.now();
    stateTimeout = setTimeout(_ => {
      chrome.windows.remove(stateId);
    }, 20 * 1000 * 60);
  });
}

// 维权退款
function openRightsWin () {
  chrome.windows.create({
    width: 10,
    height: 10,
    top: 420,
    left: 600,
    url: `http://pub.alimama.com/myunion.htm?spm=${getSpm()}#!/report/detail/rights`,
    type: 'popup'
  }, window => {
    rightId = window.id;
    rightTimeout = setTimeout(_ => {
      chrome.windows.remove(rightId);
    }, 20 * 1000 * 60);
  });
}

function openAlimamaWin () {
  chrome.windows.create({
    focused: false,
    width: 10,
    height: 10,
    top: 650,
    left: 0,
    url: `https://login.taobao.com/aso/tgs?domain=alimama&sign_account=${localStorage.getItem('sign_account')}&service=user_on_taobao&target=${localStorage.getItem('target')}`,
    type: 'popup'
  }, window => {
    alimamaId = window.id;
    console.log(`https://login.taobao.com/aso/tgs?domain=alimama&sign_account=${localStorage.getItem('sign_account')}&service=user_on_taobao&target=${localStorage.getItem('target')}`);
    alimamaTimeout = setTimeout(_ => {
      chrome.windows.remove(alimamaId);
      alimamaId = null
    }, 5 * 1000 * 60);
  });
}