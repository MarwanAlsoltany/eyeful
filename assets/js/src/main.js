/*!

 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *  Eyeful v1.0.0 | MIT License | github.com/MarwanAlsoltany/eyeful  *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *                   (c) Marwan Al-Soltany 2020                      *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 *    ███████╗  ██╗   ██╗  ███████╗  ███████╗  ██╗   ██╗  ██╗        *
 *    ██╔════╝  ╚██╗ ██╔╝  ██╔════╝  ██╔════╝  ██║   ██║  ██║        *
 *    █████╗     ╚████╔╝   █████╗    █████╗    ██║   ██║  ██║        *
 *    ██╔══╝      ╚██╔╝    ██╔══╝    ██╔══╝    ██║   ██║  ██║        *
 *    ███████╗     ██║     ███████╗  ██║       ╚██████╔╝  ███████╗   *
 *    ╚══════╝     ╚═╝     ╚══════╝  ╚═╝        ╚═════╝   ╚══════╝   *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *

 * @namespace       Eyeful
 * @author          Marwan Al-Soltany <MarwanAlsoltany@gmail.com>
 * @version         1.0.0
 * @copyright       Marwan Al-Soltany 2020
 * @license         MIT
 * @see             github.com/MarwanAlsoltany/eyeful

 */

"use strict";
import Generic from "./classes/Generic";
import Timer from "./classes/Timer";
import Todos from "./classes/Todos";
import localization from "../../lang/js-localization.json";

(function(){
  const EYEFUL = {};
  const LANG = document.documentElement.lang.substring(0, 2) || "en";
  const L10N = localization;

  const generic = new Generic({
    userInfo: "#user-info", 
    notificationsLog: "#notifications-log", 
    notificationsBar: "#notifications-bar", 
    jsonParser: "#json-parser", 
    languagePick: "#language-pick", 
    modal: "#modal", 
    settings: {
      toggles: 'label.toggle > input',
      options: {
        glt: false, gcu: false, gnl: true,
        tsd: false, tst: false, tao: true,
        mdm: false, mem: false, mam: false
      }
    },
    language: {
      key: LANG,
      localization: L10N
    }
  });
  
  const timer = new Timer({ 
    genericObjectInstance: generic, 
    statusIndicator: "#indicator", 
    dashboard: "#dashboard", 
    entriesContainer: "#entries-container", 
    clock: ["#clock", "assets/audio/mp3/alarm-faded.mp3"], 
    entriesOptions: [true, "#entries-options"]
  });
  
  const todos = new Todos({
    genericObjectInstance: generic,
    todosHeader: "#todos-header",
    todosContainer: "#todos-container",
    todosOptions: [true, "#todos-options"]
  });

  // setting greeting
  const intro = generic.$get('#intro');
  const introGreeting = window.localStorage.hasOwnProperty("userName") 
    ? generic.interpolate(L10N.generic.app.welcome.friend[LANG], localStorage.userName.split(' ')[0])
    : L10N.generic.app.welcome.stranger[LANG];
  const introLoadText = L10N.generic.app.welcome.message[LANG];
  if (intro) {
    generic.appendTo(intro, 'SPAN', introGreeting);
    generic.appendTo(intro, 'SPAN', introLoadText);
    setTimeout(() => {
      intro.className = '';
      setTimeout(() => intro.remove(), 2500);
    }, 6500);
  }

  // setting control center toggle
  const hamburger = generic.$get('#hamburger');
  if (hamburger) hamburger.addEventListener('click', () => {
      hamburger.parentElement.parentElement.classList.toggle('expanded');
  });

  // setting launch time
  const launchTime = generic.$get('#launch-time');
  if (launchTime) {
    let date = generic.dateStamp(generic.launchTime);
    let time = generic.timeStamp(generic.launchTime, false);
    generic.appendTo(launchTime, 'SPAN', L10N.generic.app.launch.time[LANG]);
    generic.appendTo(launchTime, 'SPAN', 
      (LANG !== 'ar' ? time : date)
      + " \u2013 " + 
      (LANG !== 'ar' ? date : time)
    );
  }

  // setting control center sections toggle
  const ampLabels = generic.$get('label[for="amplifier"]', true);
  if (ampLabels) ampLabels.forEach((ampLabel, index) => {
      let id = ampLabel.htmlFor + '-' + (index + 1);
      ampLabel.htmlFor = id;
      ampLabel.nextElementSibling.id = id;
  });

  // setting control center sections toggle and copyright
  const flyout = generic.$get('.flyout');
  if (flyout) {
    let date = new Date();
    let year = date.getFullYear();
    let copy = year === 2020 ? year : 2020 + ' \u2013 ' + year;
    generic.appendTo(flyout, 'SPAN', {
      className: 'copyright',
      textContent: `Marwan Al-Soltany ${copy}`
    });
    flyout.addEventListener('click', () => {
      flyout.parentElement.classList.add('expanded');
      flyout.ondblclick = () => flyout.parentElement.classList.remove('expanded');
    }, true);
  }


  // setting reference to the app
  EYEFUL.generic = generic;
  EYEFUL.timer = timer;
  EYEFUL.todos = todos;
  window.eyeful = EYEFUL;

  // prevent context menu on the webpage and verifying page leave
  window.oncontextmenu = () => false;
  // window.onbeforeunload = () => false;
}());