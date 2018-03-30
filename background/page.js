try {
  let type = 'auto'
  const typeRadio = document.querySelector('#type')
  const container = document.querySelector('#container')
  const tip = document.querySelector('#tip')
  const submitBtn = document.querySelector('#submit')
  const progressContainer = document.querySelector('#progress')
  let current = 0
  let loading = false
  const autoTemplate = `
    <section class="form-item">
      <label for="pidName">推广位基础名称</label>
      <input type="text" id="pidName" title="会在此名称上加上自增索引，比如：测试推广位1、测试推广位2...以此类推" placeholder="会在此名称上加上自增索引，比如：测试推广位1、测试推广位2...以此类推"></input>
    </section>
    <section class="form-item">
      <label for="gcid">导购类型</label>
      <input type="radio" checked value="0" name="gcid" />网站
      <input type="radio" value="7" name="gcid" />app
      <input type="radio" value="8" name="gcid" />导购
    </section>
    <section class="form-item">
      <label for="siteId">导购ID</label>
      <input type="text" id="siteId"
        placeholder="推广位所属的导购的ID"
        title="推广位所属的导购的ID"
      />
    </section>
    <section class="form-item">
      <label for="start">开始索引</label>
      <input type="number" id="start" name="start"
        title="第一个推广位开始的索引，如果是从n开始，第一个推广位就是“推广位名称+n”，并依次增加"
        placeholder="第一个推广位开始的索引，如果是从n开始，第一个推广位就是“推广位名称+n”，并依次增加" />
    </section>
    <section class="form-item">
      <label for="counts">创建数量</label>
      <input type="number" id="counts" name="counts" title="需要创建多少个推广位" placeholder="需要创建多少个推广位" />
    </section>
    <section class="form-item">
      <label for="delay">延迟时间(秒)</label>
      <input type="number" id="delay"
        placeholder="由于接口有限流措施，两次操作之间必须有一定的时间间隔，目前比较推荐的时间是10s以上"
        title="由于接口有限流措施，两次操作之间必须有一定的时间间隔，目前比较推荐的时间是10s以上"
      >
    </section>
  `
  const normalTemplate = `
    <section class="form-item">
      <label style="vertical-align: top;" for="pidNameList">推广位名称</label>
      <textarea rows="10" id="pidNameList" placeholder="请输入所有需要创建的推广位名称，并已换行分割（每一个推广位独占一行），务必按要求输入"></textarea>
    </section>
    <section class="form-item">
      <label for="gcid">导购类型</label>
      <input type="radio" checked value="0" name="gcid" />网站
      <input type="radio" value="7" name="gcid" />app
      <input type="radio" value="8" name="gcid" />导购
    </section>
    <section class="form-item">
      <label for="siteId">导购ID</label>
      <input type="text" id="siteId"
        placeholder="推广位所属的导购的ID"
        title="推广位所属的导购的ID"
      />
    </section>
    <section class="form-item">
      <label for="delay">延迟时间(秒)</label>
      <input type="number" id="delay"
        placeholder="由于接口有限流措施，两次操作之间必须有一定的时间间隔，目前比较推荐的时间是10s以上"
        title="由于接口有限流措施，两次操作之间必须有一定的时间间隔，目前比较推荐的时间是10s以上"
      >
    </section>
  `
  const progressEle = `
    <progress id="progressEle" step="1" min="0" style="width: 80%;margin: 16px 0;" />
  `
  container.innerHTML = autoTemplate

  // 切换推广位创建方式
  document.querySelector('input[value="auto"]').addEventListener('change', function (e) {
    container.innerHTML = autoTemplate
    type = 'auto'
  }, false)
  document.querySelector('input[value="normal"]').addEventListener('change', function (e) {
    container.innerHTML = normalTemplate
    type = 'normal'
  }, false)
  document.querySelector('button[type="reset"]').addEventListener('click', function (e) {
    tip.innerHTML = ''
  }, false)
  // 计算总时间
  document.addEventListener('blur', function (e) {
    const targetId = e.target.id
    if (type === 'auto' && ['start', 'consts', 'delay'].indexOf(targetId) >= 0) {
      const start = parseInt(document.querySelector('#start').value)
      const counts = parseInt(document.querySelector('#counts').value)
      const delay = parseInt(document.querySelector('#delay').value)
      if ((start || start === 0) && counts && delay) {
        tip.innerHTML = `
          <p>温馨提示：此次任务将耗时${(counts - 1) * (delay + 2) / 60}分钟以上, 如果时间比较长，你可以先去泡杯咖啡😎</p>
          <p>任务完成后，窗口将在5分钟后自动关闭</p>
        `
      }
    }
    if (type === 'normal' && ['pidNameList', 'delay'].indexOf(targetId) >= 0) {
      const delay = parseInt(document.querySelector('#delay').value)
      const pidList = document.querySelector('#pidNameList').value.trim().split('\n')
      if (delay && pidList.length && pidList[0]) {
        tip.innerHTML = `
          <p>温馨提示：此次任务将创建${pidList.length}条推广位，耗时${(pidList.length - 1) * (delay + 2) / 60}分钟以上, 如果时间比较长，你可以先去泡杯咖啡😎</p>
          <p>任务完成后，窗口将在5分钟后自动关闭</p>
        `
      }
    }
  }, true)
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
  document.querySelector('#configForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if (type === 'auto' &&
      this.pidName.value &&
      this.siteId.value &&
      (this.start.value || this.start.value === 0) &&
      this.counts.value &&
      this.delay.value
    ) {
      if (this.delay.value < 10) {
        alert('安全起见，延迟时间必须大于10s')
        return -1
      }
      startCreate({
        pidName: this.pidName.value,
        siteId: this.siteId.value,
        gcid: this.gcid.value,
        start: parseInt(this.start.value),
        counts: parseInt(this.counts.value),
        timeGap: parseInt(this.delay.value),
        type,
      })
    } else if (type === 'normal') {
      const pidList = document.querySelector('#pidNameList').value.trim().split('\n')
      if (pidList.length && pidList[0] && this.siteId.value && this.delay.value) {
        startCreate({
          pidName: pidList,
          siteId: this.siteId.value,
          gcid: this.gcid.value,
          timeGap: parseInt(this.delay.value),
          counts: pidList.length,
          type,
        })
      }
    } else {
      alert('所有字段必须正确填写！')
    }
  }, false)

  /**
   * [startCreate description]
   * @param  {[string]} pidName [pid名称，会在此基础上加上'start + currentIndex'的后缀]
   * @param  {[string]} siteId  [description]
   * @param  {[string]} tbToken [description]
   * @param  {[number]} start   [开始索引]
   * @param  {[number]} counts  [需要创建的pid数量]
   * @param  {[number]} timeGap [每次调用接口的时间间隔，会在此基础上加上0~5s的随机时间]
   * @param  {[string]} type [创建方式： auto--自动索引自增 normal--根据输入推广位名称]
   * @return {[type]}         [description]
   */
  async function startCreate({pidName, gcid, siteId, start, counts, timeGap, type}) {
    submitBtn.disabled = true
    submitBtn.innerHTML = '创建中...'
    progressContainer.innerHTML = progressEle
    document.querySelector('#progressEle').max = counts
    // 抓取淘宝token
    for(let i = 0; i < counts; i++) {
      let name = ''
      let tbToken = ''
      chrome.cookies.getAll({url: 'http://.alimama.com'}, async function (cookies) {
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
        document.querySelector('#progressEle').value = i
        name = type === 'auto' ? `${pidName}${start + i}` : pidName[i]
        let res = await createPid(name, gcid, siteId, tbToken)
        let json = await res.json()
        console.log(json)
        // 调用出错
        if (!json.ok) {
          alert(json.info.message)
          await delay(1000)
          progressContainer.innerHTML = ''
          return -1
        }
      })
      await delay(timeGap * 1000)
    }
    submitBtn.disabled = false
    submitBtn.innerHTML = '开始创建'
    alert('恭喜！推广位已全部创建完成！')
    await delay(1000)
    progressContainer.innerHTML = ''
    const stopAt = Date.now() + 5 * 1000 * 60
    const countDownId = setInterval(() => {
      tip.innerHTML = `
      <p>温馨提示：恭喜！已成功完成此次创建任务，共创建${counts}个推广位😎</p>
      <p>窗口将在${parseInt((stopAt - Date.now()) / 1000)}秒后关闭</p>
    `
    }, 1000)
    setTimeout(() => {
      clearInterval(countDownId)
      chrome.tabs.query({
        url: 'chrome-extension://*/background/*'
      }, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.remove(tab.id)
        })
      })
    }, 5 * 60 * 1000)
  }

  // 创建pid
  function createPid (pidName, gcid, siteId, tbToken) {
    return fetch('http://pub.alimama.com/common/adzone/selfAdzoneCreate.json', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `tag=29&gcid=${gcid}&siteid=${siteId}&selectact=add&newadzonename=${pidName}&t=${Date.now()}&_tb_token_=${tbToken}&pvid=10_60.191.70.18_563_1508306189599`
    })
  }

  // 延时函数
  function delay (timelog) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true)
      }, timelog + parseInt(Math.random() * 5 * 1000))
    })
  }
} catch (error) {
  console.log(error)
}