const { writeFileSync, existsSync, mkdirSync } = require('fs')
const ics = require('ics');
const moment = require('moment');

const year = 2019;
/* Month in js are 0 based, so january is 0. */
const months = 12;
const nonTradeSundays = [];
const events = [];
const exceptionDates = [
  new Date(2019, 3, 14), // niedziela przed Wielkanocą
  new Date(2019, 11, 15), // I niedziela przed Bożym Narodzeniem
  new Date(2019, 11, 22) // II niedziela przed Bożym Narodzeniem
];
const notificationHoursAndNames = [
  [null, ''],
  [12, '_one_day'],
  [36, '_two_days'],
  [60, '_three_days'],
  [84, '_four_days'],
  [108, '_five_days']
];
const fileDir = `${__dirname}\\non_trade`;

/****** ENTRY HERE ******/
checkAndSaveNonTradeSundaysAtSpecificYear(year);

createDirIfNotExist();

for (let i = 0; i < notificationHoursAndNames.length; i++) {

  createEvents(notificationHoursAndNames[i][0]);
  writeEventsToFile(notificationHoursAndNames[i][1]);

  events.splice(0, events.length);

}

/*************************/

function createDirIfNotExist(){
  !existsSync(fileDir) && mkdirSync(fileDir);
}

function checkAndSaveNonTradeSundaysAtSpecificYear(year) {
  const nonTradeSundaysAtYear = [];
  for (let month = 0; month < months; month++) {
    nonTradeSundaysAtYear.push(...getNonTradeSundaysAtSpecificMonth(year, month));
  }
  nonTradeSundays.push(...considerExcludedDates(nonTradeSundaysAtYear));
}

function getNonTradeSundaysAtSpecificMonth(year, month){
  
  let daysCount = daysInMonth(year, month);
  let date = new Date(year, month);

  const monthSundays = [];

  for (let day = 1; day <= daysCount; day++) {
    
      date.setDate(day);

    if (isSaturday(date)){
      monthSundays.push(new Date(date));
    }
  }

  return excludeLastSaturday(monthSundays);
}
// last day of last month
function daysInMonth(year, month){
  return new Date(year, month + 1, 0).getDate();
}

function isSaturday(date){
  return date.getDay() == 0;
}

function excludeLastSaturday(monthSundays){
  monthSundays.pop();
  return monthSundays;
}

function considerExcludedDates(dates) {

  const tmp = [];
  for (let i = 0; i < dates.length; i++) {
    const sunday = dates[i];
  
    let toExclude = false;
  
    for (let j = 0; j < exceptionDates.length; j++) {
      const toExcludeSunday = exceptionDates[j];
      
      if(sunday.getTime() === toExcludeSunday.getTime()){
        toExclude = true;
        break;
      }
    }
  
    if (!toExclude) {
      tmp.push(sunday);
    }
  }

  return tmp;
}

function createEvents(hoursBeforeEventNotification) {
  for (let i = 0; i < nonTradeSundays.length; i++) {

    const sundayDate = [nonTradeSundays[i].getFullYear(), nonTradeSundays[i].getMonth() + 1, nonTradeSundays[i].getDate()];
    const timestamp = moment().utc().format('YYYYMMDDTHHmmSS') + 'Z';

    const event = {
      start: sundayDate,
      end: sundayDate,
      productId: '-//Oscyp//https://github.com/oscyp//PL',
      title: 'Niedziela niehandlowa',
      timestamp: timestamp,
      alarms: hoursBeforeEventNotification !== null
              ? [{ action: 'display', description: 'Niedziela niehandlowa', trigger: { hours: hoursBeforeEventNotification, before: true } }]
              : ''
    }

    events.push(event);
  }
}

function writeEventsToFile(fileNotificationName){
  ics.createEvents(events, (error, value) => {
    if (error) {
      console.log(error)
      return
    }
    writeFileSync(`${fileDir}\\non_trade${fileNotificationName}.ics`, value)
  })
}

