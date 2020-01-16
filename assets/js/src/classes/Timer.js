"use strict";
/** 
 * @memeberof       Eyeful
 * @class           Timer
 * @classdesc       A class focused on the timer functionality
 * @requires        Generic
 * @param           {object}                           genericObjectInstance - a variable containing a Generic class instance.
 * @param           {string}                           [statusIndicator]     - query selector of the statusIndicator element.
 * @param           {string}                           dashboard             - query selector of the dashboardContainer.
 * @param           {string}                           entriesContainer      - query selector of the entriesContainer.
 * @param           {(string|array.<string>)}          [clock]               - query selector of the clock container or array including clock query selector of the clock container and audio path.
 * @param           {(boolean|array.<boolean|string>)} [entriesOptions]      - activity boolean or array of activity boolean and query selector of the entriesOptions container
 * @returns         TimerInstance
 * @throws          {(TypeError|Error)}                                      - at runtime if required arguments are not passed.
 */
export default function Timer({
  genericObjectInstance,
  statusIndicator,
  dashboard,
  entriesContainer,
  clock,
  entriesOptions,
}) {
  /** 
   * @global
   * @constant
   * @access          private
   * @type            {object}
   * @this            Timer
   * @summary capturing the global this of the factory function
   */
  const THIS = this;

  /** 
   * @global
   * @constant
   * @access          private
   * @type            {object}
   * @summary Generic class instance, used to call functions and access properties
   */
  const GOI = genericObjectInstance;
  
  /** 
   * @global
   * @access          private
   * @type            {number}
   * @summary these variables used to make unique ids to to the entries
   */
  let entriesCount = 0,
      groupsCount = 0;

  /** 
   * @global
   * @access          private
   * @type            {(number|undefined|null)}
   * @summary these variables used in building the entry
   */
  let startTime,
      endTime,
      duration = 0,
      minimumDuration = 3000;

  /** 
   * @global
   * @default
   * @access          private
   * @type            {boolean}
   * @summary this variable used to detect if timer is running
   */
  let isTimerRunning = false;

  /** 
   * @global
   * @access          public
   * @type            {array.<object>}
   * @description these variables are used internally and defined 
   *     as getters on the class instance for external access
   */
  let entriesCache = new Array(),
      deletesCache = new Array(),
      importsCache = new Array();

  const LANG = GOI.language.key;
  const L10N = GOI.language.localization;
  
  /** 
   * @external
   * @summary imported functions from the Generic class instance 
   */
  const {
    $get, 
    interpolate, 
    humanize, 
    timeStamp, 
    dateStamp, 
    editable, 
    appendTo, 
    notify, 
    extractFromHTML, 
    exportFile 
  } = GOI;

  /**
   * @global
   * @access         public
   * @type           {object}
   * @description DOM cache, this object is defined as a property on the class instance. the 
   *     object is defined like this to get use of object chronological order and avoid unexpected 
   *     object order at runtime, because 70% of the elements depend on pre-fetched elements.
   */
  const parts = {};
  parts.statusIndicator = $get(statusIndicator);
  parts.dashboard = {};
  parts.dashboard.self = $get(dashboard);
  parts.dashboard.start = parts.dashboard.self ? $get('[data-fn="start"]', parts.dashboard.self) : null;
  parts.dashboard.stop = parts.dashboard.self ? $get('[data-fn="stop"]', parts.dashboard.self) : null;
  parts.dashboard.add = parts.dashboard.self ? $get('[data-fn="add"]', parts.dashboard.self) : null;
  parts.dashboard.reset = parts.dashboard.self ? $get('[data-fn="reset"]', parts.dashboard.self) : null;
  parts.dashboard.flip = parts.dashboard.self ? $get('[data-fn="flip"]', parts.dashboard.self) : null;
  parts.entriesContainer = $get(entriesContainer);
  parts.clock = {};
  parts.clock.self = clock instanceof Array ? $get(clock[0]) : $get(clock);
  parts.clock.audio = clock instanceof Array ? clock[1] : null;
  parts.clock.time = null;
  parts.clock.alarm = null;
  parts.entriesOptions = {};
  parts.entriesOptions.enabled = entriesOptions instanceof Array ? entriesOptions[0] : false;
  parts.entriesOptions.self = entriesOptions instanceof Array ? $get(entriesOptions[1]) : null;
  parts.entriesOptions.erase = parts.entriesOptions.self ? $get('[data-fn="erase"]', parts.entriesOptions.self) : null;
  parts.entriesOptions.restore = parts.entriesOptions.self ? $get('[data-fn="restore"]', parts.entriesOptions.self) : null;
  parts.entriesOptions.recover = parts.entriesOptions.self ? $get('[data-fn="recover"]', parts.entriesOptions.self) : null;
  parts.entriesOptions.export = parts.entriesOptions.self ? $get('[data-fn="export"]', parts.entriesOptions.self) : null;

  /** 
   * 
   * @method          _clock
   * @memberof        Eyeful.Timer
   * @access          private
   * @returns         void         undefined
   * @summary a function responsible for the clock and the alarm 
   */
  const _clock = () => {
    // if a container for clock is provided, build it up
    if (parts.clock.self) {
      // build clock structure and set it to parts.clock.time
      parts.clock.time = appendTo(parts.clock.self, 'TIME', {className: 'time'});
      // append two spans one for time the other for session
      appendTo(parts.clock.time, 'SPAN');
      appendTo(parts.clock.time, 'SPAN');
      time();
      function time() {
        // get present time
        let now = new Date();
        // 12 format with secounds as inner text
        let time12 = timeStamp(now, true, true);
        parts.clock.time.children[0].textContent = time12;
        // 24 format without secounds as attribute
        let time24 = timeStamp(now, false, false);
        parts.clock.time.children[0].title = time24;
        // get session from hours
        let session = now.getHours();
        session < 12 ? session = L10N.timer.clock.session.am[LANG] : session = L10N.timer.clock.session.pm[LANG];
        parts.clock.time.children[1].textContent = session;
        // repeat this process
        requestAnimationFrame(time);
      }
      if (parts.clock.audio) {
        // build alarm and set it to parts.clock.alarm
        parts.clock.alarm = appendTo(parts.clock.self, 'FORM', {className: 'alarm'});
        const alarm = {
          // localize passed arguments and bind events
          new: function(alarmParts) {
            // alarm parts
            this.label = alarmParts.label;
            this.hours = alarmParts.hours;
            this.minutes = alarmParts.minutes;
            this.set = alarmParts.set;
            this.reset = alarmParts.reset;
            this.audio = alarmParts.audio;
            // optional callbacks passed to the corresponding function
            this.setCallback = alarmParts.setCallback;
            this.resetCallback = alarmParts.resetCallback;
            // shared variables
            this.caption = this.label.textContent;
            this.duration = null;
            this.timeout = null;
            this.interval = null;
            // binding events to the inputs
            this.set.addEventListener("click", alarm.turnOn.bind(this));
            this.reset.addEventListener("click", alarm.turnOff.bind(this));
          },
          // set alarm method
          turnOn: function(event) {
            event.preventDefault();
            // get milliseconds out of the hours and minutes
            this.duration = 
                ((this.hours.valueAsNumber ? this.hours.valueAsNumber : 0) * 3.6e+6) + 
                ((this.minutes.valueAsNumber ? this.minutes.valueAsNumber : 0) * 6e+4);
            // validate duration
            if (this.duration == 0) return notify(L10N.timer.clock.alarm.error[LANG], 7500, 'log');
            // excute the callback if the passed argument is a function
            if (typeof this.setCallback == "function") this.setCallback();
            // alter the label to show remaining time
            this._remainingTime(true);
            // change inputs state and notify the user
            this.hours.disabled = true;
            this.minutes.disabled = true;
            this.set.disabled = true;
            this.reset.disabled = false;
            notify(interpolate(L10N.timer.clock.alarm.on[LANG], this.duration/6e+4));
            // set the alarm and notify the user
            this.timeout = setTimeout(() => {
              // reset alarm and play sound
              this.turnOff();
              this.audio.play();
              notify(interpolate(L10N.timer.clock.alarm.done[LANG], this.duration/6e+4));
            }, this.duration);
          },
          // reset alarm method
          turnOff: function() {
            // clear the timeout if not cleared and excute the callback
            clearTimeout(this.timeout);
            if (typeof this.resetCallback == "function") this.resetCallback();
            // reset the original label
            this._remainingTime(false);
            // reset inputs state and notify the user
            this.hours.disabled = false;
            this.minutes.disabled = false;
            this.set.disabled = false;
            this.reset.disabled = true;
            notify(L10N.timer.clock.alarm.off[LANG]);
          },
          // show remaining time
          _remainingTime: function(boolean) {
            // make a local copy of the duration and the label
            let durationCache = this.duration;
            if (boolean === true) {
              // set initial altered label
              this.label.textContent = interpolate(L10N.timer.clock.alarm.caption.transitional[LANG], durationCache/6e+4);
              // update label after after 1m by subtracting 1m from it
              this.interval = setInterval(() => {
                if (durationCache > 6e+4) durationCache -= 6e+4;
                this.label.textContent = interpolate(L10N.timer.clock.alarm.caption.temporary[LANG], durationCache/6e+4);
              }, 6e+4);
            } else if (boolean === false) {
              // clear the pending interval for label update
              clearInterval(this.interval);
              // set initial label back
              this.label.textContent = this.caption;
            } else console.error('Argument can be either "true" or "false"');
          }
        };
        // initialize new alarm
        alarm.new({
          label: appendTo(parts.clock.alarm, 'LABEL', {textContent: L10N.timer.clock.alarm.caption.initial[LANG]}),
          hours: appendTo(parts.clock.alarm, 'INPUT', {type: 'number', pattern: '[0-9]*', placeholder: 'hrs', min: 0}),
          minutes: appendTo(parts.clock.alarm, 'INPUT', {type: 'number', pattern: '[0-9]*', placeholder: 'min', min: 0, max: 59, step: 5}),
          set: appendTo(parts.clock.alarm, 'INPUT', {type: 'submit', value: L10N.timer.clock.alarm.button.on[LANG]}),
          setCallback: function() { parts.clock.self.dataset.active = 'alarm'; },
          reset: appendTo(parts.clock.alarm, 'INPUT', {type: 'reset', value: L10N.timer.clock.alarm.button.off[LANG], disabled: true}),
          resetCallback: function() { parts.clock.self.dataset.active = ''; },
          audio: appendTo(parts.clock.alarm, 'AUDIO', {src: parts.clock.audio})
        });
      }
    }
  };

  /** 
   * @method          _createEntry
   * @memberof        Eyeful.Timer
   * @access          private
   * @param           {object}     start       - start time date object.
   * @param           {object}     end         - end time date object.
   * @param           {number}     consumption - number of milliseconds.
   * @param           {string}     text1       - text content of the 5th cell.
   * @param           {string}     text2       - text content of the 6th cell.
   * @returns         object                   - an HTMLElement ready to be appended
   * @summary a function that creates an entry, fill it up and attach functions.
   */
  const _createEntry = (start, end, consumption, text1 = '', text2 = '') => {
    // make a row and increment entries count
    const entryRow = document.createElement('TR');
    const entryCellsCount = 6;
    entriesCount++;
    // for however cells are required make a cell 
    // and format its inner text or bind a function
    for (let i = 1; i <= entryCellsCount; i++) {
      const entryCell = document.createElement('TD');
      switch (i) {
        case 1:
          entryCell.innerText = entriesCount;
          THIS.remove(entryCell);
          break;
        case 2:
          entryCell.innerText = timeStamp(start);
          break;
        case 3:
          entryCell.innerText = timeStamp(end);
          break;
        case 4:
          entryCell.innerText = humanize(consumption);
          break;
        case 5:
          entryCell.innerText = text1;
          editable(entryCell, text1, L10N.timer.createEntry.field.update.question[LANG]);
          break;
        case 6:
          entryCell.innerText = text2;
          editable(entryCell, text2, L10N.timer.createEntry.field.update.question[LANG]);
          break;
        default: console.error('Too many cells!');
      }
      entryRow.appendChild(entryCell);
    }
    entryRow.dataset.id = entriesCount;
    // drop is used in recovery
    entryRow.dataset.drop = 'false';
    return entryRow;
  };

  /** 
   * @method          _createDivider
   * @memberof        Eyeful.Timer
   * @access          private
   * @param           {string}         text           - text content of the element
   * @param           {string}         title          - title of the element
   * @param           {array.<string>} attributeArray - array of two element [name, value]
   * @returns         object                          - an HTMLElement ready to be appended
   * @summary a function that creates entries divider and fill it up with content.
   */
  const _createDivider = (text, title, attributeArray) => {
    const entryRow = document.createElement('TR');
    const entryCell = document.createElement('TH');
    entryCell.textContent = text || '';
    entryCell.title = title || '';
    entryCell.colSpan = 6;
    entryRow.appendChild(entryCell);
    entryRow.className = 'entries-divider';
    if (attributeArray) entryRow.dataset[attributeArray[0]] = attributeArray[1];
    return entryRow;
  };

  /** 
   * @method          _recoverEntries
   * @memberof        Eyeful.Timer
   * @access          private
   * @param           {array.<object>} array - array of entry objects
   * @returns         number                 - recovered entries count
   * @description a function that creates entries back from an array of objects of objects (entry 
   *     objects), it creates elements, assigns unique ids, attach events, wraps the result with 
   *     two dividers and finally appends the fresh created entries back in the entriesContainer.
   */
  const _recoverEntries = (array) => {
    // get date from the passed array, the array is an array of objects 
    // where the first object contains user id, session id, and date
    let date = dateStamp(new Date(array[0].date));
    // for each recovered set of entries give it a special group
    // identifier which increments each time a new group is added
    let group = groupsCount++ < 10 ? '0' + groupsCount : groupsCount;
    // if the passed array contains only the authentication object 
    // (first object) then return a special kind of dividers
    if (array.length == 1) {
      let barren = _createDivider(
        interpolate(L10N.timer.recoverEntries.divider.barren.text[LANG], date),
        L10N.timer.recoverEntries.divider.barren.title[LANG],
        ['for', `G${group}-barren`]
      );
      return parts.entriesContainer.appendChild(barren);
    }
    // if the array contains 2 or more objects then create opening and closing 
    // dividers in an array and set some titles to them and a data-for attribute
    let groupWrappers = [
      _createDivider(
        interpolate(L10N.timer.recoverEntries.divider.opening.text[LANG], date),
        interpolate(L10N.timer.recoverEntries.divider.opening.title[LANG], date), 
        ['for', `G${group}-opening`]
      ),
      _createDivider(
        interpolate(L10N.timer.recoverEntries.divider.closing.text[LANG], date), 
        interpolate(L10N.timer.recoverEntries.divider.closing.title[LANG], date), 
        ['for', `G${group}-closing`]
      )
    ];
    // append the opening divider
    parts.entriesContainer.appendChild(groupWrappers[0]);
    // technically recovered entries count
    let recoveredCount = 0;
    // loop through the array starting from the second object
    for (let i = 1; i < array.length; i++) {
      const entry = array[i];
      // if it was not deleted and was an actual entry
      if (entry.drop == 'false') {
        recoveredCount++
        // create a row and loop through the content array 
        // create a cell for each item it the content array 
        // and bind the corresponding function to it if 
        // it is 1, 5 or 6 then append it to the row
        const entryRow = document.createElement('TR');
        entry.content.forEach((cellData, index) => {
          const entryCell = document.createElement('TD');
          switch (index) {
            case 0:
              entryCell.textContent = cellData;
              THIS.remove(entryCell);
              break;
            case 4: case 5:
              entryCell.textContent = cellData;
              editable(entryCell, undefined, L10N.timer.recoverEntries.field.update.question[LANG]);
              break;
            default: entryCell.textContent = cellData;
          }
          entryRow.appendChild(entryCell);
        });
        // for each recreated row modify its id to the
        // format (old id)-(recovered-Group)-(group)
        // so that it is always unique no matter how many
        // recovered cells are created
        entryRow.dataset.id = `${entry.id}-r-G${group}`;
        // data-drop is not necessary for recovered 
        // entries, since these cannot be exported again
        /* entryRow.dataset.drop = entry.drop; */
        parts.entriesContainer.appendChild(entryRow);
      } else if (entry.date) {
        // if it was a day divider recreate it
        // with a special data-for attribute
        let dateDivider = _createDivider(
          entry.content[0], 
          L10N.timer.recoverEntries.divider.day.title[LANG], 
          ['for', `G${group}-${entry.date}`]
        );
        parts.entriesContainer.appendChild(dateDivider);
      } /* else console.log(entry); */
    }
    // finally append the closing group wrapper
    parts.entriesContainer.appendChild(groupWrappers[1]);
    return recoveredCount;
  };

  /**
   * @method          start
   * @memberof        Eyeful.Timer
   * @access          public
   * @returns         void
   * @description this function starts the timer and sets a value to the global startTime 
   *      variable it does also updates the dashboard view and shows a notification.
   */
  this.start = () => {
    if (isTimerRunning) {
      notify(L10N.timer.start.hint[LANG], 7500, 'log');
    } else {
      isTimerRunning = true;
      startTime = new Date();
      parts.dashboard.self.dataset.active = 'start';
      if (parts.statusIndicator) parts.statusIndicator.className = 'running';
      notify(L10N.timer.start.message[LANG]);
    }
  };

  /**
   * @method          stop
   * @memberof        Eyeful.Timer
   * @access          public
   * @returns         void
   * @description this function stops the timer and sets a value to the global endTime variable, 
   *     tests and calculates the duration it does also updates the dashboard view and shows a notification.
   */
  this.stop = () => {
    if (isTimerRunning == false) {
      notify(L10N.timer.stop.hint[LANG], 7500, 'log');
    } else {
      isTimerRunning = false;
      endTime = new Date();
      duration = endTime.getTime() - startTime.getTime();
      // if duration is less the the minimum abort
      if (duration < minimumDuration) {
        isTimerRunning = true;
        endTime = null;
        duration = 0;
        notify(interpolate(L10N.timer.stop.error[LANG], minimumDuration/1000), 7500, 'log');
        return;
      }
      parts.dashboard.self.dataset.active = 'stop';
      if (parts.statusIndicator) parts.statusIndicator.className ='waiting';
      notify(L10N.timer.stop.message[LANG]);
    }
  };

  /**
   * @method          add
   * @memberof        Eyeful.Timer
   * @access          public
   * @returns         void
   * @description this function creates and adds an entry, pushes the entry in the entriesCache
   *      array, resets the timer and it does also updates the dashboard view and shows a notification.
   */
  this.add = () => {
    if (!isTimerRunning) {
      if (duration === 0) notify(L10N.timer.add.hint[LANG], 7500, 'log');
      else {
        const readyEntry = _createEntry(
          startTime, 
          endTime, 
          duration, 
          L10N.timer.add.text.click[LANG],
          L10N.timer.add.text.none[LANG]
        );
        entriesCache.push(readyEntry);
        parts.entriesContainer.appendChild(readyEntry);
        THIS.reset();
        parts.dashboard.self.dataset.active = 'add';
        if (parts.statusIndicator) parts.statusIndicator.className = 'willing';
        notify(L10N.timer.add.message[LANG]);
      }
    } else notify(L10N.timer.add.error[LANG], 7500, 'log');
  };

  /**
   * @method          reset
   * @memberof        Eyeful.Timer
   * @access          public
   * @returns         void
   * @description this function resets the timer, i.e. the global variables 
   *     startTime, endTime and duration updates the view and show a notification.
   */
  this.reset = () => {
    if (isTimerRunning) notify(L10N.timer.reset.error[LANG], 7500, 'log');
    else {
      if ((startTime === null || endTime === undefined) && duration === 0) {
        notify(L10N.timer.reset.hint[LANG], 7500, 'log');
      } else notify(L10N.timer.reset.message[LANG]);
      startTime = null;
      endTime = null;
      duration = 0
      isTimerRunning = false;
      parts.dashboard.self.dataset.active = '';
      if (parts.statusIndicator) parts.statusIndicator.className = 'willing';
    }
  };

  /**
   * @method          flip
   * @memberof        Eyeful.Timer
   * @access          public
   * @returns         void
   * @description this function is a combination of the method: start, stop, add, reset.
   *     it does also updates the dashboard view and shows a notification.
   */
  this.flip = () => {
    if (!isTimerRunning) notify(L10N.timer.flip.hint[LANG]);
    else {
      THIS.stop();
      if (duration > minimumDuration) {
        THIS.add();
        THIS.start();
        notify(L10N.timer.flip.message[LANG]);
      } else notify(interpolate(L10N.timer.flip.error[LANG], minimumDuration/1000), 7500, 'log');
    }
  };

  /**
   * @method          remove
   * @memberof        Eyeful.Timer
   * @access          public
   * @param           {object}     element   - HTMLElement
   * @returns         void
   * @exception       {TypeError}            - if the passed argument is not an HTMLElement.
   * @description this function is used in the private method _createEntry it attaches an 
   *     event to an element to delete the parent element. it adds attributes that help 
   *     in restoring the entry, unshifts the removed entry in the deletesCache array.
   */
  this.remove = (element) => {
    if (element instanceof HTMLElement) {
      element.addEventListener("click", () => {
        // bind a function the the passed element
        // so that on click its parent gets deleted  
        let removeTarget = element.parentElement;
        let removeTargetId = removeTarget.dataset.id;
        let removeTargetSibling = removeTarget.previousElementSibling;
        // update its data-drop attribute
        if (removeTarget.dataset.drop == 'false') removeTarget.dataset.drop = 'true';
        // here are some temporary attributes that get added 
        // to the element containing a prefix and a selector to 
        // help in finding its right place if it was restored 
        if (removeTargetSibling === null) {
          removeTarget.dataset.after = 'null';
        } else if (removeTargetSibling.dataset.for) {
          removeTarget.dataset.after = 'f' + removeTargetSibling.dataset.for;
        } else if (removeTargetSibling.dataset.date) {
          removeTarget.dataset.after = 'd' + removeTargetSibling.dataset.date;
        } else if (removeTargetSibling.dataset.id) {
          removeTarget.dataset.after = 'i' + removeTargetSibling.dataset.id;
        } else removeTarget.dataset.after = 'undefined';

        removeTarget.parentElement.removeChild(removeTarget);
        deletesCache.unshift(removeTarget);
        // some logic to show an accurate notification 
        let removePrefix = L10N.timer.remove.prefix.original[LANG];
        if (isNaN(removeTargetId)) {
          removePrefix = L10N.timer.remove.prefix.recovered[LANG];
          removeTargetId = removeTargetId.substring(0, removeTargetId.indexOf('-r-G'));
        }
        notify(interpolate(L10N.timer.remove.message[LANG], removePrefix, removeTargetId));
      });
    } else throw new Error('Wrong argument!');
  };

  /**
   * @method          erase
   * @memberof        Eyeful.Timer
   * @access          public
   * @param           {boolean}    boolean   - all or imported boolean
   * @returns         void
   * @exception       {TypeError}            - if the passed argument is not of type boolean.
   * @description this function eases the entries from the entriesContainer without 
   *     caching the element in the deletesCache array which makes entries unrestorable.
   */
  this.erase = (boolean) => {
    if (parts.entriesContainer.childElementCount > 0) {
      // if boolean is true erase entries container content
      if (boolean === true) {
        parts.entriesContainer.innerHTML = '';
        notify(L10N.timer.erase.all.message[LANG]);
      } else if (boolean === false) {
        // if false do the same as true but re-append all entries 
        // that are original to this session from entries cache array
        if ($get('tr[data-id*="-r-G"]')) {
          parts.entriesContainer.innerHTML = '';
          entriesCache.forEach(cachedEntry => {
            parts.entriesContainer.appendChild(cachedEntry);
          });
          notify(L10N.timer.erase.imported.message[LANG]);
        } else notify(L10N.timer.erase.imported.hint[LANG], 7500, 'log');
      } else throw new Error('Wrong argument!');
    } else notify(L10N.timer.erase.all.hint[LANG], 7500, 'log');
  };

  /**
   * @method          restore
   * @memberof        Eyeful.Timer
   * @access          public
   * @param           {number}     iterateNumber - number of entries to be restored
   * @returns         void
   * @exception       {TypeError}                - if the passed argument is not of type number and > 1.
   * @description this function restores one or more elements depending on the passed 
   *     argument. it looks inside the deletesCache array and restores the desired number 
   *     of entires then deleted them from the deletes cache it depends on the attributes 
   *     that gets set via the remove method to put the element back in its right place.
   */
  this.restore = (iterateNumber) => {
    if (typeof iterateNumber == 'number') {
      if (iterateNumber == 0) throw new Error('Wrong argument!');
      if (deletesCache.length == 0) return notify(L10N.timer.restore.hint[LANG]);
      let i = 0;
      while (i < iterateNumber) {
        // if the given iteration number is greater than the 
        // deletes cache array length then break the while loop
        if (deletesCache[0] === undefined) break;
        let lastDeleted = deletesCache[0];
        // reset the data-drop attribute to false
        if (lastDeleted.dataset.drop == 'true') lastDeleted.dataset.drop = 'false';
        // if the deleted element has the temporary after attribute
        if (lastDeleted.dataset.after) {
          let selector = lastDeleted.dataset.after;
          let sibling;
          switch (selector.charAt(0)) {
            // (n = null) if the element was the first child
            case 'n': sibling = parts.entriesContainer.firstElementChild; break;
            // (f = for) if element was after an element with data-for attribute
            case 'f': sibling = $get(`tr[data-for="${selector.substr(1)}"]`, parts.entriesContainer).nextElementSibling; break;
            // (d = date) if element was after an element with data-date attribute
            case 'd': sibling = $get(`tr[data-date="${selector.substr(1)}"]`, parts.entriesContainer).nextElementSibling; break;
            // (i = id) if element was after an element with data-id attribute
            case 'i': sibling = $get(`tr[data-id="${selector.substr(1)}"]`, parts.entriesContainer).nextElementSibling; break;
            // (u = undefined) a fallback
            case 'u': sibling = parts.entriesContainer.lastElementChild; break;
          }
          // remove the temporary after attribute and insert the element
          lastDeleted.removeAttribute('data-after');
          parts.entriesContainer.insertBefore(lastDeleted, sibling);
        } else parts.entriesContainer.appendChild(lastDeleted);
        deletesCache.shift();
        i += 1;
      }
      if (iterateNumber == 1) notify(L10N.timer.restore.last.message[LANG]);
      else notify(L10N.timer.restore.all.message[LANG]);
    } else throw new Error('Argument must be a number and greater than 1');
  };

  /**
   * @method          recover
   * @memberof        Eyeful.Timer
   * @access          public
   * @returns         void
   * @description this function gets the last imported file parse it does some testing against 
   *      it and passes the parsed file as an array to the private method _recoverEntires.
   */
  this.recover = () => {
    // get the last imported file from the Generic class instance
    let latestImport = GOI.imports[0];
    if (latestImport === undefined) {
      return notify(L10N.timer.recover.hint[LANG]);
    } else if (importsCache.includes(latestImport)) {
      return notify(L10N.timer.recover.error.familiar[LANG]);
    } else {
      importsCache.push(latestImport);
      latestImport = JSON.parse(latestImport);
      if (Array.isArray(latestImport) === false) {
        notify(L10N.timer.recover.error.type[LANG]);
        return false;
      } else if (!latestImport[0].userId) {
        // if the authentication object doesn't exist
        notify(L10N.timer.recover.error.format[LANG]);
      } else if (latestImport[0].userId != localStorage.userId) {
        notify(L10N.timer.recover.error.user[LANG]);
        return false;
      } else if (latestImport[0].sessionId == localStorage.sessionId) {
        notify(L10N.timer.recover.error.session[LANG]);
        return false;
      } else {
        let recoveredCount = _recoverEntries(latestImport);
        let recoveredDate = dateStamp(new Date(latestImport[0].date));
        if (recoveredCount == 0) notify(L10N.timer.recover.success.nothing[LANG]);
        else if (recoveredCount == 1) notify(interpolate(L10N.timer.recover.success.single[LANG], recoveredDate));
        else notify(interpolate(L10N.timer.recover.success.multiple[LANG], recoveredCount, recoveredDate));
      }
    }
  };
  /**
   * @method          export
   * @memberof        Eyeful.Timer
   * @access          public
   * @param           {string}     fileFormat - file format (extension without ".")
   * @returns         void
   * @description this function gets the contents of the entriesContainer,
   *     does some manipulation on it and then pass it further to be exported.
   */
  this.export = (fileFormat) => {
    if (typeof fileFormat == 'string') {
      // check if entries container contains any original or imported entries.
      if (entriesCount == 0 && parts.entriesContainer.childElementCount == 0) {
        notify(L10N.timer.export.hint[LANG]);
      } else if (isTimerRunning === true) {
        notify(L10N.timer.export.error[LANG], 7500, 'log');
      } else {
        // construct a file name
        let fileName = `Times_${fileFormat.toUpperCase()}`;
        notify(L10N.timer.export.prepare[LANG], 7500, 'log');
        setTimeout(() => {
          if (fileFormat == 'json') {
            // make a json from the original entries of
            // this session and make a file out of them
            exportFile(
              extractFromHTML(entriesCache, 'array', true),
              fileName,
              '.json',
              'application/json'
            );
          } else if (fileFormat == 'html') {
            // get the outer html of the entries container 
            // and wrap it with some html boilerplate
            const template = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Times Table</title><style>body{font-family:Arial,Helvetica,sans-serif;padding:64px 16px;margin:0;}table{border-collapse:collapse;width:100%;max-width:992px;margin:0 auto;}tr{transition:.3s ease;}tr:nth-child(even){background:#f2f2f2;}tr:hover{background:#d9d9d9;}td,th{text-align:left;border:1px solid #d9d9d9;padding:12px;}th{background:#0087eb;color:white;text-transform:uppercase;padding:16px 12px;}</style></head><body>{{content}}</body></html>';
            exportFile(
              template.replace(/{{(\w+)}}/ig, parts.entriesContainer.parentElement.outerHTML),
              fileName,
              '.html',
              'text/html'
            );
          } else if (fileFormat == 'xls') {
            // get the outer html of the entries container 
            // and wrap it with a template for xls files
            fileName = 'Times_Sheet';
            const template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta charset="utf-8"/><head><!--[if gte mso 9]><xml version="1.0" encoding="UTF-8" standalone="yes" ?><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Times Sheet</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>{{content}}</body></html>';
            exportFile(
              template.replace(/{{(\w+)}}/ig, parts.entriesContainer.parentElement.outerHTML),
              fileName,
              '.xls',
              'application/vnd.ms-excel'
            );
          } else if (fileFormat == 'csv') {
            // get the outer text of the entries container 
            // and replace tabs with commas 
            exportFile(
              'sep=,\n' + parts.entriesContainer.parentElement.outerText.replace(/\u0009/g, ',').replace(/\u2248/g, 'eq.'),
              fileName,
              '.csv',
              'text/csv'
            );
          } else if (fileFormat == 'txt') {
            exportFile(
              parts.entriesContainer.parentElement.outerText,
              fileName,
              '.txt',
              'text/plain'
            );
          } else return false;
        }, 1500);
      }
    } else throw new Error('Wrong argument!');
  };

  /** 
   * @memberof        Eyeful.Timer
   * @access          public
   * @property        {object}         parts        - assign parts to the class instance.
   * @property        {object}         entriesCache - contains getter.
   * @property        {array}          deletesCache - contains getter.
   * @property        {object}         importsCache - contains getter.
   * @summery defining getters and some public variables on the class instance.
   */
  Object.defineProperties(this, {
    parts: {
      value: parts,
      writable: false,
      enumerable: false,
      configurable: false
    },
    entriesCache: {
      get() { return entriesCache; },
      enumerable: false,
      configurable: false
    },
    deletesCache: {
      get() { return deletesCache; },
      enumerable: false,
      configurable: false
    },
    importsCache: {
      get() { return importsCache; },
      enumerable: false,
      configurable: false
    }
  });
  /**
   * @function        iife
   * @memberof        Eyeful.Timer
   * @access          private
   * @returns         void         undefined
   * @description invokes a private method, binds events to some elements, checks 
   *     entriesOptions and attach events to elements, does the handling of last 
   *     session restoration and finally, binds events for keyboard shortcuts.
   */
  const iife = (function() {
    _clock();
    // insert a day divider after 24 hours or run time
    setInterval(() => {
      let newDate = dateStamp(new Date());
      let dateDivider = _createDivider(
        interpolate(L10N.timer.app.divider.day.text[LANG], newDate),
        L10N.timer.app.divider.day.title[LANG],
        ['date', newDate]
      )
      entriesCache.push(dateDivider);
      parts.entriesContainer.appendChild(dateDivider);
    }, 8.64e+7);
    // bind functions to dashboard buttons
    parts.dashboard.start.addEventListener('click', THIS.start);
    parts.dashboard.stop.addEventListener('click', THIS.stop);
    parts.dashboard.add.addEventListener('click', THIS.add);
    parts.dashboard.reset.addEventListener('click', THIS.reset);
    parts.dashboard.flip.addEventListener('click', THIS.flip);
    // bind events to entires options depending on their data-fn attribute
    if (parts.entriesOptions.self) {
      parts.entriesOptions.self.dataset.options = parts.entriesOptions.enabled;
      if (parts.entriesOptions.enabled === true) {
        parts.entriesOptions.erase.addEventListener('click', (event) => {
          if (event.target.dataset.fn == 'imported') THIS.erase(false);
          else if (event.target.dataset.fn == 'all') THIS.erase(true);
          else notify(L10N.timer.erase.hint[LANG]);
        });
        parts.entriesOptions.restore.addEventListener('click', (event) => {
          if (event.target.dataset.fn == 'all') THIS.restore(deletesCache.length || 1);
          else if (event.target.dataset.fn == 'two') THIS.restore(2);
          else if (event.target.dataset.fn == 'one') THIS.restore(1);
          else if (event.target.dataset.fn == 'restore') THIS.restore(1);
        });
        parts.entriesOptions.recover.addEventListener('click', (event) => {
          if (event.target.dataset.fn == 'open') {
            GOI.parts.jsonParser.select.click();
            // keep checking if file has been read and 
            // its value is set to the textarea
            let selected = setInterval(() => {
              if (GOI.parts.jsonParser.textarea.value != "") {
                clearInterval(selected);
                GOI.parts.jsonParser.import.click();
                selected = null;
              }
            }, 250);
            // if the user hit cancel clear the interval 
            // after 3 minutes if he didn't try again
            setTimeout(() => {
              if(selected != null) {
                clearInterval(selected);
                console.warn('Data could not be retrieved, fetching was canceled after 3 minutes.');
              }
            }, 18e+4);
          } else if (event.target.dataset.fn == 'recover') THIS.recover();
        });
        parts.entriesOptions.export.addEventListener('click', (event) => {
          switch (event.target.dataset.fn) {
            case 'json': case 'txt': 
            case 'html': case 'csv': 
              THIS.export(event.target.dataset.fn);
              break;
            case 'xls':
            default: THIS.export('xls');
          }
        });
      }
    }
    // bind function to keyboard events
    window.addEventListener('keydown', function(event) {
      if (event.altKey === true && event.shiftKey === true) {
        switch (event.code) {
          case "Digit1": THIS.start(); break;
          case "Digit2": THIS.stop(); break;
          case "Digit3": THIS.add(); break;
          case "Digit4": THIS.reset(); break;
          case "Digit5":
          case "KeyF": THIS.flip(); break;
          case "KeyZ": THIS.restore(1); break;
          case "KeyE": THIS.export('xls'); break;
          case "KeyJ": THIS.export('json'); break;
          case "KeyR": THIS.recover(); break;
          case "KeyO": openFile(); break;
        }
        function openFile() {
          let explorer = $get('[data-fn="open"]');
          if (explorer !== null) explorer.click();
          else console.warn('Element with data-fn="open" could not be found!');
        }
      }
    });
    // recover last session
    if (localStorage.hasOwnProperty("sessionLast")) {
      setTimeout(() => {
        notify(interpolate(L10N.timer.recover.saved.hint[LANG], '9'), 10000, 'log', () => {
          const lastSession = JSON.parse(localStorage.getItem("sessionLast"));
          localStorage.removeItem("sessionLast");
          _recoverEntries(lastSession);
          notify(L10N.timer.recover.saved.success[LANG]);
        });
      }, 10000);
    }
    // save current session
    window.addEventListener('beforeunload', () => {
      if (
        // check if session has any undeleted entries
        parts.entriesContainer.childElementCount > 0 
        && $get('tr[data-drop="false"]') !== null
      ) {
        const currentSession = extractFromHTML(entriesCache, 'array', true);
        localStorage.setItem("sessionLast", currentSession);
      }
    });
  }());
}