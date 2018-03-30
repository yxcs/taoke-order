/**
 * 导出推广位
 */
const submitBtn = document.querySelector('#submit')
const progressContainer = document.querySelector('#progress')
const progressEle = `
    <p id="step"></p>
    <progress id="progressEle" step="1" min="0" style="width: 80%;margin: 16px 0;" />
  `
// 阻止危险事件
document.addEventListener('keydown', function (e) {
  console.log(e)
  // 禁止 ctrl + r / ctrl + shift + r / f5
  if (e.ctrlKey && e.keyCode === 82 ||
    (e.ctrlKey && e.shiftKey && e.keyCode === 82) ||
    e.keyCode === 116) {
    e.preventDefault()
    console.log('按了没用的。。就不让你刷新')
  }
}, true)

// 开始创建
document.querySelector('#exportForm').addEventListener('submit', function (e) {
  e.preventDefault()
  const gcid = parseInt(this.gcid.value)
  const start = parseInt(this.start.value)
  const end = parseInt(this.end.value)
  const gap = parseInt(this.gap.value)
  if (end < start) {
    alert('结束页码不能小于开始页码！')
  }
  submitBtn.disabled = true
  submitBtn.innerHTML = '正在导出...'
  progressContainer.innerHTML = progressEle
  startGenerate (start, end, gap, gcid)
})

async function startGenerate (start, end, gap, gcid) {
  let pagelist = []
  let tbToken = ''
  chrome.cookies.getAll({url: 'http://.alimama.com'}, function (cookies) {
    cookies && cookies.some(item => {
      if (item.name === '_tb_token_') {
        tbToken = item.value
        return true
      }
      return false
    })
    if (!tbToken) {
      alert('没有获取到tbToken！')
      progressBar
      return -1
    }
  })
  const progressBar = document.querySelector('#progressEle')
  const step = document.querySelector('#step')
  step.textContent = '第一步，获取指定页面的推广位...'
  progressBar.max = end - start + 1
  progressBar.value = 0
  await delay(500)
  if (tbToken) {
    for (let i = start; i <= end; i++) {
      const resJson = await getData(i, tbToken, 3, gap, gcid)
      if (resJson.data.pagelist) {
        pagelist = pagelist.concat(resJson.data.pagelist)
        console.log(i)
        progressBar.value = i
      } else {
        return
      }
    }
    if (pagelist.length) {
      step.textContent = '第二步，生成Excel文件...'
      progressBar.value = 0
      let workbooks = XLSX.read([], {type: 'array'})
      // 过滤非必要数据
      pagelist = pagelist.map(item => {
        return {
          推广位名称: item.name,
          所属导购: item.sitename,
          pid: item.adzonePid,
        }
      })
      let sheets = XLSX.utils.json_to_sheet(pagelist, {
        header: ["推广位名称", "所属导购", "pid"],
      })

      workbooks.Sheets[workbooks.SheetNames[0]] = sheets
      let workbookOuts = XLSX.write(workbooks, {bookType: 'xls', type: 'binary'})

      saveAs(new Blob([s2ab(workbookOuts), {type: 'application/octet-stream'}]), `推广位导出--${Date.now()}.xls`)
      progressBar.value = 1
      new Notification('导出成功！')
      submitBtn.disabled = false
      submitBtn.innerHTML = '开始导出'
      progressContainer.innerHTML = ''
    }
  }
}

async function getData (page, tbToken, tab, gap, gcid) {
  await delay(gap * 1000 + parseInt(Math.random() * 1000))
  const res = await fetch(`http://pub.alimama.com/common/adzone/adzoneManage.json?toPage=${page}&_tb_token_=${tbToken}&_input_charset=utf-8&tab=${tab}&t=${Date.now()}&perPageSize=40&gcid=${gcid}`, {
    method: 'get',
    credentials: 'include',
  })
  return res.json()
}

function delay (timelog) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, timelog)
  })
}

// to array buffer
function s2ab(s) {
  if(typeof ArrayBuffer !== 'undefined') {
    var buf = new ArrayBuffer(s.length);
    var view = new Uint8Array(buf);
    for (var i=0; i!=s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  } else {
    var buf = new Array(s.length);
    for (var i=0; i!=s.length; ++i) buf[i] = s.charCodeAt(i) & 0xFF;
    return buf;
  }
}