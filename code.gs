function doGet () {
  return HtmlService.createTemplateFromFile('index').evaluate().setTitle('WhatsApp 解封提交工具').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

function include (filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent()
}

/**
 * 设置存储数据的表格
 * TODO: 需要放入表格 ID
 */
const sheet = SpreadsheetApp.openById('Input Sheet ID')
// 存放剩余次数，表格默认命名为 Data
const getSheetData = sheet.getSheetByName('Data').getRange('A1')
// 存放解封结果，表格默认命名为 Result
const getResultSheet = sheet.getSheetByName('Result')

// 剩余使用量
function getUsage () {
  return getSheetData.getValue()
}

// 解封数量
function unblockCount () {
  return getResultSheet.getRange('A:A').getValues().length
}

// 更新使用量
function resetData () {
  getSheetData.setValue(MailApp.getRemainingDailyQuota())
  successfulUnblock()
}

// 获取成功解封的号码
function successfulUnblock () {
  const thread = GmailApp.getInboxThreads()
  const result = []
  for (const mail of thread) {
    const content = mail.getMessages()[0].getBody()
    // 成功解封的字样
    if (content.indexOf('removed the ban') > -1) {
      // 筛选出号码
      const phoneNumber = content.replace(/\n|request #.+|<.*?>|. days|[^0-9]/g, '')
      result.push([phoneNumber])
    } // End if
  }
  // 排除重复
  const newArray = unique(result)
  getResultSheet.getRange(1, 1, newArray.length, 1).setValues(newArray)
}

/**
 * @description 查询解封状态
 * @param {Array} phoneNumArray - 查询的号码
 * @returns {Array} 查询结果
 */
function queryState (phoneNumArray) {
  const value = getResultSheet.getRange('A:A').getValues()
  // 设置新数组
  const newValue = []
  for (let i = 0; i < value.length; i++) {
    newValue.push(value[i].toString())
  }
  const result = []
  for (const phoneNumber of phoneNumArray) {
    if (newValue.indexOf(phoneNumber.replace(/[^0-9]/g, '')) > -1) {
      // unbaned
      result.push([phoneNumber, '已解封'])
    } else {
      // still banned
      result.push([phoneNumber, '未解封'])
    } // End if
  } // End for of
  return result
}

/**
 * @description 数组排除重复和空值
 * @param {Array} arr - 数组
 * @returns {Array} 新数组
 */
function unique (arr) {
  const map = {}
  const newArray = []
  for (let i = 0; i < arr.length; i++) {
    const value = arr[i]
    if (value[0]) {
      if (map[value]) continue
      else {
        map[value] = 1
        newArray.push(arr[i])
      } // End if
    } // End if
  }
  return newArray
}

/**
 * @description 随机生成写信的模板
 * @param {string} phone - 写信模版
 * @returns {string} 生成好的模板
 */
function unBlockTemplate (phone) {
  // TODO: 需要设置写信的模版，并且放入 phone 变量
  const template = [
  ]
  // 生成随机数
  const index = Math.floor((Math.random() * template.length))
  return template[index]
}

/**
 * @description 发送邮件
 * @param {string} phoneNumber - 手机号码
 * @returns {string} 完成
 */
function sendEmail (phoneNumber) {
  // 获取剩余次数
  let usage = getUsage()
  phoneNumber.forEach(function (phone) {
    usage--
    // 检测是否达到上限
    if (usage === 0) {
      return '剩余次数已用完'
    }
    /**
     * 发送邮件
     * TODO: 需要设置发送邮件的标题
     */
    MailApp.sendEmail('support@support.whatsapp.com', 'Input Email Title', unBlockTemplate(phone))
    // 记录剩余次数
    getSheetData.setValue(usage)
  })
  return '提交完成！请耐心等待，请勿重复提交！'
}
