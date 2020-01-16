"use strict";
/** 
 * @memeberof       Eyeful
 * @class           Generic
 * @classdesc       an abstract class containing some core functions that other classes rely on.
 * @param           {string}                   [userInfo]             - query selector of the userInfo container.
 * @param           {string}                   [notificationsLog]     - query selector of the notificationsLog container.
 * @param           {string}                   [notificationsBar]     - query selector of the notificationsBar element.
 * @param           {string}                   jsonParser             - query selector of the jsonParser container.
 * @param           {string}                   [languagePick]         - query selector of the languagePick container.
 * @param           {string}                   modal                  - query selector of the modal container.
 * @param           {object}                   [settings]             - object with two properties "toggles" and "options" where key match data-fn attributes and vlaues are their activity.
 * @param           {string}                   [settings.toggles]     - query selector of the checkboxes class.
 * @param           {object.<string, boolean>} [settings.options]     - object with unlimited properties where the key will be the option and the pproperty will be the state.
 * @param           {object}                   language               - object with two properties "key" and "localization".
 * @param           {string}                   language.key           - object with two properties "key" and "localization".
 * @param           {object<string, *>}        language.localization  - object 
 * @throws          {Error}                                           - at runtime if language object is not provided.
 * @throws          {TypeError}                                       - on events binding or firing if userInfo, jsonParser or modal are not provided.
 * @returns         GenericInstance
 * @see             {@link ~/assets/lang/js-localization.json|Localizations}
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 * For this class to run flawlessly, userInfo, modal and jsonParser must be provided *
 * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *
 */
export default function Generic({
  userInfo,
  notificationsLog,
  notificationsBar,
  jsonParser,
  languagePick,
  modal,
  settings,
  language
}) {
  /** 
   * @global
   * @constant
   * @access          private
   * @type            {object}
   * @this            Generic
   * @summary capturing the global this of the factory function
   */
  const THIS = this;

  /** 
   * @global
   * @member          {object.<string>}
   * @access          public
   * @enum            {string}
   * @description initial client object, this object 
   *     is defined as a getter on the class instance
   */
  let client = {
    userName: '',
    userSettings: '',
    userLanguage: '',
    userId: '',
    sessionId: ''
  };

  /** 
   * @global
   * @type            {object}
   * @access          public
   * @summery application launch time
   */
  let launchTime = new Date();

  /** 
   * @global
   * @member          {array.<string>}
   * @access          public
   * @description imported files via json parser, this array 
   *     is defined as a getter on the class instance.
   */
  let imports = "an array will be assigned here by _jsonParser";

  /** 
   * @global
   * @default
   * @access          private
   * @summery here lives the notification bar timeout
   */
  let notificationsTimeout = null;

  // check if the language object is provided
  if (language === undefined || language.constructor !== Object) {
    throw new Error('Language object must be provided!');
  }

  /** 
   * @global
   * @constant
   * @access          public
   */
  const LANG = language.key || 'en';

  /** 
   * @global
   * @constant
   * @access          public
   * @summery this variable is used to deliver localized experience to the user
   */
  const L10N = language.localization || {};

  /** 
   * @method          $get
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {string}            element         - query selector.
   * @param           {object}            ancestor        - HTMLElement to look into.
   * @param           {boolean}           allArrayBoolean - wether to return the element(s) in an array.
   * @returns         (object|object[])                   - one element or array including one or more elements.
   */
  this.$get = function(element, ancestor, allArrayBoolean) {
    let returnValue;
    // check if second argument is of type boolean if so process 
    // this argument as if it was the third and default to false
    let returnAll = typeof ancestor === "boolean" ? ancestor : allArrayBoolean || false;
    // check if the given ancestor is a valid HTMLElemet 
    // then querySelector(All), if not default to document 
    let forefather = ancestor instanceof HTMLElement ? ancestor : document;
    // check if selector is a valid id if so get it using getElementById
    let isValidId = (/^#[A-Za-z]+[\w\-\:\.]*$/).test(element);
    if (isValidId) {
      // take out the hash from the selctor and get element
      returnValue = document.getElementById(element.replace("#", ""));
    } else if (returnAll) {
      // if all elements matching the selector requested
      returnValue = forefather.querySelectorAll(element);
    } else {
      // if only first element matching the selector requested
      returnValue = forefather.querySelector(element);
    }
    // if all elements matching the selector requested return the array-like object (NodeList) 
    // as an actual array to have all array methods available otherwise return single element
    return returnAll ? Array.from(returnValue) : returnValue;
  };

  /**
   * @global
   * @type            {object.<*>}
   * @access          public
   * @summary DOM cache, this object is defined as a property on the class instance.
   * @description the object is defined like this to get use of object chronological order and avoid 
   *     unexpected object order at runtime, because 60% of the elements depend on pre-fetched elements.
   */
  const parts = {};
  parts.downloadLink = null;
  parts.userInfo = {};
  parts.userInfo.self = THIS.$get(userInfo);
  parts.userInfo.controls = parts.userInfo.self ? THIS.$get('[data-fn="controls"]', parts.userInfo.self) : null;
  parts.userInfo.table = parts.userInfo.self ? THIS.$get('[data-fn="table"]', parts.userInfo.self) : null;
  parts.userInfo.reload = parts.userInfo.self ? THIS.$get('[data-fn="reload"]', parts.userInfo.self) : null;
  parts.notifications = {};
  parts.notifications.self = THIS.$get(notificationsLog);
  parts.notifications.controls = parts.notifications.self ? THIS.$get('[data-fn="controls"]', parts.notifications.self) : null;
  parts.notifications.log = parts.notifications.self ? THIS.$get('[data-fn="log"]', parts.notifications.self) : null;
  parts.notifications.bar = THIS.$get(notificationsBar);
  parts.jsonParser = {};
  parts.jsonParser.self = THIS.$get(jsonParser);
  parts.jsonParser.file = parts.jsonParser.self ? THIS.$get('[data-fn="file"]', parts.jsonParser.self) : null;
  parts.jsonParser.textarea = parts.jsonParser.self ? THIS.$get('[data-fn="textarea"]', parts.jsonParser.self) : null;
  parts.jsonParser.select = parts.jsonParser.self ? THIS.$get('[data-fn="select"]', parts.jsonParser.self) : null;
  parts.jsonParser.import = parts.jsonParser.self ? THIS.$get('[data-fn="import"]', parts.jsonParser.self) : null;
  parts.languagePick = {},
  parts.languagePick.self = THIS.$get(languagePick);
  parts.languagePick.controls = parts.languagePick.self ? THIS.$get('[data-fn="controls"]', parts.languagePick.self) : null;
  parts.languagePick.radios = parts.languagePick.self ? THIS.$get('[data-fn="language"]', parts.languagePick.self, true) : null;
  parts.modal = {};
  parts.modal.backdrop = THIS.$get(modal);
  parts.modal.form = parts.modal.backdrop ? THIS.$get('[data-fn="form"]', parts.modal.backdrop) : null;
  parts.modal.heading = parts.modal.form ? THIS.$get('[data-fn="heading"]', parts.modal.form) : null;
  parts.modal.message = parts.modal.form ? THIS.$get('[data-fn="message"]', parts.modal.form) : null;
  parts.modal.current = parts.modal.form ? THIS.$get('[data-fn="current"]', parts.modal.form) : null;
  parts.modal.text = parts.modal.form ? THIS.$get('[data-fn="text"]', parts.modal.form) : null;
  parts.modal.cancel = parts.modal.form ? THIS.$get('[data-fn="cancel"]', parts.modal.form) : null;
  parts.modal.submit = parts.modal.form ? THIS.$get('[data-fn="submit"]', parts.modal.form) : null;
  parts.settings = {};
  parts.settings.toggles = settings instanceof Object ? THIS.$get(settings.toggles, true) : [];
  parts.settings.options = settings instanceof Object ? (settings.options ? settings.options : {}) : {};
  
  // localStorage polyfill
  if (!localStorage) localStorage = {
    storage: {},
    setItem: function(property, value) { return this.storage[property] = String(value); },
    getItem: function(property) { return this.storage.hasOwnProperty(property) ? this.storage[property] : undefined; },
    removeItem: function(property) { return delete this.storage[property]; },
    clear: function() { return this.storage = {}; },
    get length() {
      return Object.keys(this.storage).length;
    }
  };

  /** 
   * @method          _uuidv4
   * @memberof        Eyeful.Generic
   * @access          private
   * @returns         string
   * @summary a simple function to generate an "uuidv4" like id
   */
  const _uuidv4 = () => {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g,
    c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
  };

  /** 
   * @deprecated
   * @method          _ruid
   * @memberof        Eyeful.Generic
   * @access          private
   * @param           {number}       [length] - length of the id, max 11.
   * @returns         string
   * @summary a simple function to generate a random string id.
   */
  const _ruid = (length = 11) => Math.random().toString(36).toUpperCase().substr(2, length);

  /** 
   * @method          _clientCheck
   * @memberof        Eyeful.Generic
   * @access          private
   * @returns         void
   * @summary client object handler.
   */
  const _clientCheck = () => {
    // define default properties to the client object
    const defaultName = 'Nobody';
    const defaultSettings = JSON.stringify(Object.values(parts.settings.options));
    const defaultLanguage = 'en';
    const defaultId = _uuidv4();

    // check if any client proprties alraedy exist in localStorage
    if (!localStorage.hasOwnProperty("userName")) {
      // notify the user to update his name
      setTimeout(() => THIS.notify(L10N.generic.clientCheck.user.name.hint[LANG], 10000), 25000);
      client.userName = defaultName;
    } else client.userName = localStorage.getItem("userName");
    if (!localStorage.hasOwnProperty("userSettings")) {
      client.userSettings = defaultSettings;
    } else client.userSettings = localStorage.getItem("userSettings");
    if (!localStorage.hasOwnProperty("userLanguage")) {
      client.userLanguage = LANG || defaultLanguage;
    } else client.userLanguage = localStorage.getItem("userLanguage");
    if (!localStorage.hasOwnProperty("userId")) {
      client.userId = defaultId; 
      localStorage.setItem("userId", defaultId);
    } else client.userId = localStorage.getItem("userId");
    // generate a new session id on every app launch
    client.sessionId = _uuidv4();
    localStorage.setItem("sessionId", client.sessionId);

    // check and take action depending on user preferred Language
    languageRouter(document.baseURI);

    // get user info table, fill it up and bind events
    if (parts.userInfo.table) {
      for (let row of parts.userInfo.table.rows) {
        for (let i = 0; i < row.cells.length; i++) {
          let cell = row.cells[i];
          switch (i) {
            case 0: 
              if (cell.innerHTML == "") cell.textContent = row.dataset.id.charAt(0).toUpperCase() + row.dataset.id.slice(1);
              break;
            case 1:
                // check table cells and fill them according to their id
                if (row.dataset.id == 'userSettings') {
                  if (localStorage.hasOwnProperty(row.dataset.id)) {
                    // normaly the date object lives in the first element of the settings array
                    let date = THIS.dateStamp(new Date(JSON.parse(client.userSettings).pop()));
                    cell.textContent = THIS.interpolate(L10N.generic.clientCheck.user.settings.saved[LANG], date);
                  } else cell.textContent = L10N.generic.clientCheck.user.settings.unsaved[LANG];
                } else if (row.dataset.id == 'userLanguage') {
                  if (localStorage.hasOwnProperty(row.dataset.id)) {
                    cell.textContent = L10N.generic.clientCheck.user.language.saved[LANG] || LANG.toUpperCase();
                  } else cell.textContent = THIS.interpolate(L10N.generic.clientCheck.user.language.unsaved[LANG], LANG.toUpperCase());
                } else if (row.dataset.id == 'userName') {
                  if (localStorage.hasOwnProperty(row.dataset.id)) {
                    cell.textContent = client.userName;
                  } else cell.textContent = L10N.generic.clientCheck.user.name.default[LANG] || defaultName;
                } else cell.textContent = client[row.dataset.id];
              break;
            case 2:
              if (cell.innerHTML == "") cell.textContent = '\u2588';
              userInfoHandler(cell); 
              break;
          }
        }
      }
    }
    // user info table, events handler
    function userInfoHandler(element) {
      // element = the cell that contains the button to mutate the data
      // NOTE! these functions expect a specific structure of the table
      // say: | th (name) | td (value) | td (event) | is a row where it
      // has a data-id attribute and only "value" should be updated via js
      element.addEventListener("click", () => {
        // attach a specific task based on id of the element and ask user for confirmation
        if (element.parentElement.dataset.id == "userName") {
          THIS.editable(
            'promise', 'simple', 
            L10N.generic.clientCheck.user.name.update.question[LANG]
          ).then(result => {
            localStorage.setItem("userName", result);
            element.previousElementSibling.textContent = result;
            THIS.notify(L10N.generic.clientCheck.user.name.update.success[LANG]);
          }).catch(error => {
            THIS.notify(THIS.interpolate(L10N.generic.clientCheck.user.name.update.error[LANG], error));
          });
        } else if (element.parentElement.dataset.id == "userSettings") {
          THIS.editable(
            'promise', 'consent', 
            L10N.generic.clientCheck.user.settings.save.question[LANG], 
            '', 'true'
          ).then(result => {
            if (result == 'true') {
              let settings = [];
              // loop through settings get their value and save it in localStorage
              parts.settings.toggles.forEach((toggle, index) => {
                settings.push(toggle.checked);
                if (index + 1 === parts.settings.toggles.length) {
                  settings.push(new Date());
                  localStorage.setItem("userSettings", JSON.stringify(settings));
                }
              });
              element.previousElementSibling.textContent = L10N.generic.clientCheck.user.settings.save.saved[LANG];
              THIS.notify(L10N.generic.clientCheck.user.settings.save.success[LANG]);
            }
          }).catch(e => '');
        } else if (element.parentElement.dataset.id == "userId") {
          THIS.editable(
            'promise', 'consent', 
            L10N.generic.clientCheck.user.id.save.question[LANG], 
            L10N.generic.clientCheck.user.id.save.description[LANG], 
            'true'
          ).then(result => {
            if (result == 'true') THIS.exportFile(`{"userId":"${client.userId}"}`, 'User_ID', '.json', 'application/json');
          }).catch(e => '');
        } else if (element.parentElement.dataset.id == "userLanguage") {
          // user language has its own handlers duo to the complexity
          THIS.notify(L10N.generic.clientCheck.user.language.hint[LANG]);
        } else if (element.parentElement.dataset.id == "sessionId") {
          THIS.notify(L10N.generic.clientCheck.user.session.hint[LANG]);
        } else {
          THIS.notify(L10N.generic.clientCheck.user.settings.button.unassigned[LANG]);
        }
      });
    }
    // select, import, parse, and save user config json to localStorage
    function settingsImport() {
      parts.jsonParser.select.click();
      // select and import file
      let selected = setInterval(() => {
        if (parts.jsonParser.textarea.value != "") {
          clearInterval(selected);
          selected = null;
          parts.jsonParser.import.click();
          let imported = JSON.parse(imports[0]);
          // check serialization type and if it has the minimum required token
          if (imported.constructor === Object && imported.hasOwnProperty('userId')) {
            let needed = Object.keys(client);
            for (let property in imported) {
              // exclude unknown properties
              if (needed.includes(property)) {
                client[property] = imported[property]; 
                localStorage.setItem(property, imported[property]);
              } else {
                console.warn('Unknown property in imported User Configuration: ' + property);
              }
            }
            THIS.notify(L10N.generic.clientCheck.user.settings.import.success[LANG]);
          } else return THIS.notify(L10N.generic.clientCheck.user.settings.import.error[LANG]);
          // always delete user config from imports after finishing processing it
          // to prevent unexpected error showing to the user from other component(s)
          imports.unshift();
        }
      }, 250);
      // clear the interval after 3m if the user didn't select any file or
      // clicked cancel, there isn't any way to know if the user hit cancel
      setTimeout(() => {
        if(selected != null) {
          clearInterval(selected);
          console.warn('Data could not be retrieved, fetching was canceled after 3 minutes.');
        }
      }, 18e+4);
    }
    // show confirmation and onclick export client object as json file
    function settingsExport() {
      THIS.editable(
        'promise', 'consent', 
        L10N.generic.clientCheck.user.settings.export.question[LANG], 
        '', 'true'
      ).then(result => {
        if (result == 'true') THIS.exportFile(JSON.stringify(client), 'User_Config', '.json', 'application/json');
      }).catch(e => '');
    }
    // show confirmation and onclick reset settings to defaults
    function settingsReset() {
      THIS.editable(
        'promise', 'consent', 
        L10N.generic.clientCheck.user.settings.reset.question[LANG], 
        '', 'true'
      ).then(result => {
        if (result == 'true') {
          localStorage.clear();
          THIS.notify(L10N.generic.clientCheck.user.settings.reset.success[LANG]);
        }
      }).catch(e => '');
    }
    // apply from user settings
    function settingsApply() {
      if (parts.settings.toggles.length) {
        // parse current settings (default or saved)
        const io = JSON.parse(client.userSettings);
        parts.settings.toggles.forEach((toggle, index) => {
          let option = toggle.dataset.fn;
          // add event and match setting to the element data-fn attribute
          toggle.addEventListener("change", function() {
            if (parts.settings.options[option] == false) {
              // unchecked by default elements. i.e.: adds class to the body when checked
              if (this.checked) document.body.classList.add(option);
              else document.body.classList.remove(option);
            } else {
              // checked by default elements. i.e.: adds class to the body when unchecked
              if (!this.checked) document.body.classList.add(option);
              else document.body.classList.remove(option);
            }
          });
          // set the reversed state to the toggle and click it 
          // to fire the events and get the current settings
          toggle.checked = !io[index];
          toggle.click();
        });
      }
    }
    settingsApply();

    // bind an event for app reload button with
    // a confirmation step prior to page reload
    if (parts.userInfo.reload) {
      parts.userInfo.reload.addEventListener('click', () => {
        THIS.editable(
          'promise', 'consent', 
          L10N.generic.clientCheck.user.settings.reload.question[LANG], 
          L10N.generic.clientCheck.user.settings.reload.description[LANG], 
          'true'
        ).then(result => {
          if (result == 'true') return location.reload(false)
        }).catch(e => '');
      });
    }
    // get user info controls, loop through them and 
    // bind events depending on their data-fn attribute
    if (parts.userInfo.controls) {
      Array.from(parts.userInfo.controls.children).forEach(button => {
        switch (button.dataset.fn) {
          case 'import': button.addEventListener('click', settingsImport); break;
          case 'export': button.addEventListener('click', settingsExport); break;
          case 'reset': button.addEventListener('click', settingsReset); break;
          default: button.onclick = () => THIS.notify(L10N.generic.clientCheck.user.settings.unassigned.button[LANG]);
        }
      });
    }
    // redirect user to the right document
    function languageRouter(origin) {
      let baseURL = origin || location.origin + '/';
      // if no preferred language is assigned escape redirection.
      if (localStorage.hasOwnProperty("userLanguage")) {
        if (
          // if preferred language is english
          client.userLanguage == defaultLanguage && 
          location.href != baseURL
        ) location.replace(baseURL);
        if (
          // if preferred language is not english
          client.userLanguage != defaultLanguage && 
          location.pathname.indexOf('/' + client.userLanguage) < 0
        ) location.replace(baseURL + client.userLanguage);
      } else {
        if (location.hash == '#/?') {
          // depending on user prefered languages
          let availableLanguages = L10N.translations.available;
          let navigatorLanguages = navigator.languages.map(key => key.substring(0, 2));
          let familiarLanguage = navigatorLanguages.filter(key => availableLanguages.includes(key))[0];
          if (familiarLanguage) location.replace(baseURL + familiarLanguage);
          else location.hash = '';
        }
      }
    }
    // set default user language
    function languageSet() {
      THIS.editable(
        'promise', 'consent', 
        L10N.generic.clientCheck.user.language.set.question[LANG], 
        L10N.generic.clientCheck.user.language.set.description[LANG], 
        'true'
      ).then(result => {
        if (result == 'true') {
          try {
            // get checked language and set it to the client object and the localStorage
            let selectedLanguage = parts.languagePick.radios.filter(radio => radio.checked == true)[0].id;
            if (typeof selectedLanguage == "string") client.userLanguage = selectedLanguage;
            else return;
            localStorage.setItem('userLanguage', client.userLanguage);
            THIS.notify(L10N.generic.clientCheck.user.language.set.success[LANG]);
          } catch(error) {
            console.error(error);
            return THIS.notify(L10N.generic.clientCheck.user.language.set.error[LANG], 'log');
          }
        }
      }).catch(e => '');
    }
    // unset default user language
    function languageUnset() {
      // check if a language is set already
      if (localStorage.hasOwnProperty('userLanguage')) {
        THIS.editable(
          'promise', 'consent', 
          L10N.generic.clientCheck.user.language.unset.question[LANG], 
          '', 'true'
        ).then(result => {
          if (result == 'true') {
            localStorage.removeItem('userLanguage');
            THIS.notify(L10N.generic.clientCheck.user.language.unset.success[LANG]);
          }
        }).catch(e => '');
      } else {
        THIS.notify(L10N.generic.clientCheck.user.language.unset.error[LANG]);
      }
    }
    // get language controls loop through them and 
    // bind events depending on their data-fn attribute
    if (parts.languagePick.controls) {
      Array.from(parts.languagePick.controls.children).forEach(button => {
        switch (button.dataset.fn) {
          case 'set': button.addEventListener('click', languageSet); break;
          case 'unset': button.addEventListener('click', languageUnset); break;
          default: button.onclick = () => THIS.notify(L10N.generic.clientCheck.user.settings.button.unassigned[LANG]);
        }
      });
    }
    // set active state to the selected language
    if (parts.languagePick.radios) {
      let currentLanguage = parts.languagePick.radios.filter(radio => radio.id == LANG);
      try {
        currentLanguage[0].checked = true;
      } catch(error) {
        console.error('Could not set current language view. Element is not found!', error);
      } finally {
        if (currentLanguage.length > 1) console.warn('Keep elements IDs unique', currentLanguage);
      }
    }
  };

  /** 
   * @method          _jsonParser
   * @memberof        Eyeful.Generic
   * @access          private
   * @returns         array.<string> - reference of a local array that gets mounted on the global imports array.
   * @description handles the import and overwrites the global imports array with the inner jsonCache array.
   */
  const _jsonParser = () => {
    const jsonCache = [],
    // regular expressions to check if a string is a json 
          jsonLike = /^\[|\{[^]+\]|\}$/m,
          jsonArray = /\[.*\{.*\:.*\}\]/g,
          jsonObject = /\{.*\:.*\}/g,
          jsonPretty = /\s+\s|\t+/gm;
    const handleFile = (file) => {
      // instantiate a file reader and return a promise
      const fileReader = new FileReader();
      return new Promise((resolve, reject) => {
        fileReader.onerror = () => {
          fileReader.abort();
          reject(new DOMException("Problem parsing input file."));
        };
        fileReader.onload = () => resolve(fileReader.result);
        fileReader.readAsText(file);
      });
    }
    const handleUpload = async (event) => {
      // get latest file from file input 
      // await result from file reader and
      // set the result as value of the textarea
      const file = event.target.files[0];
      try {
        const fileContents = await handleFile(file);
        parts.jsonParser.textarea.value = fileContents;
      } catch (error) {
        console.error(error.message);
        parts.jsonParser.textarea.value = 'ERR';
      }
    }
    const handleImport = () => {
      // check if textarea containes text wether it's imported or pasted
      if (parts.jsonParser.textarea.value.length > 0) {
        // check if string is a json
        if (jsonLike.test(parts.jsonParser.textarea.value)) {
          let jsonString = parts.jsonParser.textarea.value;
          // minify json if it's pretty
          if (jsonPretty.test(jsonString)) {
            jsonString = JSON.stringify(JSON.parse(jsonString), null, 0);
          }
          // a more accurate & specific check against minified json types
          if (jsonArray.test(jsonString) || jsonObject.test(jsonString)) {
            // cache the string, clear up the file input and the textarea, finally show messages
            jsonCache.unshift(jsonString);
            parts.jsonParser.file.value = "";
            parts.jsonParser.textarea.value = "";
            parts.jsonParser.textarea.placeholder = L10N.generic.jsonParser.placeholder.success[LANG];
            THIS.notify(L10N.generic.jsonParser.message.success[LANG]);
          } else {
            // fallback if json didn't pass the third test
            parts.jsonParser.textarea.value = "";
            parts.jsonParser.textarea.placeholder = L10N.generic.jsonParser.fallback[LANG];
          }
        } else {
          // clear up the input and the textarea, show error message
          parts.jsonParser.textarea.value = "";
          parts.jsonParser.textarea.placeholder = L10N.generic.jsonParser.placeholder.error[LANG];
          THIS.notify(L10N.generic.jsonParser.message.error[LANG]);
        }
      } else {
        // if import is clicked when textarea is empty
        parts.jsonParser.textarea.placeholder = L10N.generic.jsonParser.placeholder.nothing[LANG];
      }
    }
    // set placeholder to the textarea and bind functions to elements
    var textInputPlaceholder = L10N.generic.jsonParser.placeholder.initial[LANG];
    if (parts.jsonParser.textarea) {
      parts.jsonParser.textarea.placeholder = textInputPlaceholder;
      parts.jsonParser.textarea.addEventListener('focus', () => parts.jsonParser.textarea.placeholder = textInputPlaceholder);
    }
    if (parts.jsonParser.file) parts.jsonParser.file.addEventListener('change', handleUpload);
    if (parts.jsonParser.import) parts.jsonParser.import.addEventListener('click', handleImport);
    if (parts.jsonParser.select) parts.jsonParser.select.addEventListener('click', () => parts.jsonParser.file.click());
    // set files array to the global imports variable
    imports = jsonCache;
  };

  /** 
   * @method          interpolate
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {string}       string    - a string with {{var}} placeholder(s).
   * @param           {(...*)}       variables - spreaded strings and/or numbers or array (any type that can be stringified).
   * @example                                  - placeholder pattern {{(word) or (symbol + word) / (number + word) or (word + number)}}.
   * @returns         string                   - interpolated string.
   * @description interpolates the passed string with the passed arguments (replaces
   *      the placeholders {{var}}) respectively as the arguments were passed.
   */
  this.interpolate = function(string, ...variables) {
    let index = -1;
    return string.replace(/{{([^\s])(\w*)(\d*)}}/ig, (match) => {
      index++
      return typeof variables[index] != 'undefined' ? variables[index] : match;
    });
  };

  /**
   * @method          timeStamp
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {object}       date      - date object.
   * @param           {boolean}      [seconds] - wether seconds should be included.
   * @param           {boolean}      [format]  - wether hours should be 12-hour format.
   * @returns         string                   - 24-hour or 12-hour format timestamp.
   * @summary returns padded timestamp hh:mm:ss or hh:mm
   */
  this.timeStamp = (date, seconds = true, format = false) => {
    // destructure the date object, pad it 
    // and then return the desired format 
    let h = date.getHours();
    if (format) h = h % 12 || 12;
    h = h < 10 ? "0" + h : h;
    let m = date.getMinutes();
    m = m < 10 ? "0" + m : m;
    if (seconds) {
      let s = date.getSeconds();
      s = s < 10 ? "0" + s : s;
      return `${h}:${m}:${s}`;
    } else return `${h}:${m}`;
  };

  /**
   * @method          dateStamp
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {object}       date        - date object.
   * @param           {string}       [separator] - char to separate between days, months, years.
   * @returns         string                     - dd(X)mm(X)yyyy, where (X) == separator.
   */
  this.dateStamp = (date, separator = "/") => {
    // destructure the date object, pad it and then 
    // return a datestamp the desired separator 
    let d = date.getDate();
    d = d < 10 ? "0" + d : d;
    let m = date.getMonth() + 1;
    m = m < 10 ? "0" + m : m;
    let y = date.getFullYear();
    return `${d}${separator}${m}${separator}${y}`;
  };

  /**
   * @method          humanize
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {number}       milliseconds - number of milliseconds.
   * @param           {boolean}      [complete]   - wether format should include seconds or rounded minutes.
   * @returns         string                      - human readable timestamp hh:mm:ss or hh:mm ≈ (Xm).
   */
  this.humanize = (milliseconds, complete = false) => {
    // destructure milliseconds in hours, minutes and seconds
    // return a timestamp with rounded minutes or with secounds
    let h = milliseconds / (1000 * 60 * 60),
        hAbsolute = Math.floor(h),
        hh = hAbsolute > 9 ? hAbsolute : "0" + hAbsolute;
    let m = (h - hAbsolute) * 60,
        mAbsolute = Math.floor(m),
        mm = mAbsolute > 9 ? mAbsolute : "0" + mAbsolute;
    if (complete) {
      let s = (m - hAbsolute) * 60,
          sAbsolute = Math.floor(s),
          ss = sAbsolute > 9 ? sAbsolute : "0" + sAbsolute;
      return `${hh}:${mm}:${ss}`;
    } else {
      let about = Math.round(milliseconds / (1000 * 60));
      return `${hh}:${mm} \u2248 (${about}m)`;
    }
  };

  /**
   * @method          appendTo
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {object}       [forefather] - HTMLElement.
   * @param           {string}       nodeName     - element name.
   * @param           {object}       [properties] - HTMLElement properties passed in object notation.
   * @returns         object                      - a reference to the element appended to the forefather with the passed object properties.
   * @summary create element apply properties and return it.
   */
  this.appendTo = (forefather = document, nodeName = 'DIV', properties) => {
    let element = document.createElement(nodeName);
    if (typeof properties == 'object') {
      for (let property in properties) {
        element[property] = properties[property];
      }
    } else element.textContent = properties || '';
    return forefather.appendChild(element);
  };

  /**
   * @method          notify
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {string}       message          - message to be showed and/or logged.
   * @param           {number}       [duration]       - for how long in milliseconds.
   * @param           {string}       [exclude]        - name of a function (e.g.: "log" or "bar").
   * @param           {string}       [clickCallback]  - a function to be excuted if the notification bar is clicked
   * @returns         void                            - shows notification bar & logs the notification.
   */
  this.notify = (message, duration = 7500, exclude, clickCallback) => {
    if (exclude !== "bar") bar(message, duration);
    if (exclude !== "log") log(message, new Date());
    if (typeof clickCallback === "function") emit(clickCallback, duration);
    function bar(message, duration) {
      if (parts.notifications.bar) {
        if (message == parts.notifications.bar.innerText) {
          parts.notifications.bar.classList.add("attention");
        } else {
          // add message to the notifications bar
          parts.notifications.bar.innerText = message;
          parts.notifications.bar.className = "notify";
          // reset the timeout if any it existes
          if (notificationsTimeout) {
            clearTimeout(notificationsTimeout);
            notificationsTimeout = null;
          }
          notificationsTimeout = setTimeout(() => {
            parts.notifications.bar.className = "";
          }, duration);
        }
      }
    }
    function log(message, time) {
      if (parts.notifications.log) {
        // prepare element and bind an onclick event to remove it
        let element = THIS.appendTo(parts.notifications.log, 'LI', { 
          onclick: function() {
            this.parentElement.removeChild(this);
            // refresh view without scrolling
            refresh(false);
          }
        });
        // appeand content ipdate view and scroll to the bottom
        THIS.appendTo(element, 'SPAN', {textContent: message});
        THIS.appendTo(element, 'TIME', {textContent: THIS.timeStamp(time)});
        refresh();
      }
    }
    // a function that accepts a callback which gets fired on clicking the notification bar
    function emit(callback, duration) {
      setTimeout(() => parts.notifications.bar.onclick = '', duration - 500);
      parts.notifications.bar.onclick = (event) => {
        parts.notifications.bar.onclick = '';
        callback();
      }
    }
    function refresh(goToBottom = true) {
      // refresh notifications count and scroll to the bottom
      if (goToBottom == true) parts.notifications.log.scrollTop = parts.notifications.log.scrollHeight;
      if (parts.notifications.controls) {
        Array.from(parts.notifications.controls.children).forEach(button => {
          // bind event for clear button
          if (button.dataset.fn == 'clear') {
            button.onclick = () => {
              THIS.editable(
                'promise', 'consent', 
                L10N.generic.notify.clear.question[LANG], 
                L10N.generic.notify.clear.description[LANG], 
                1
              ).then(result => {
                if (result == 1) {
                  parts.notifications.log.innerHTML = "";
                  refresh(false);
                }
              }).catch(e => '');
            }
          } else if (button.dataset.fn == 'counter') {
            button.textContent = parts.notifications.log.childElementCount;
          }
        });
      }
    }
  };

  /**
   * @method          editable
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {(object|string)} elementOrPromise   - HTMLElement |or| "promise" string exclusively.
   * @param           {(string|string)} [defaultOrClass]   - value to be indicated as default |or| add as class.
   * @param           {(string|string)} [title]            - value to be set as modal header.
   * @param           {(string|string)} [paragraph]        - value to be set as modal message.
   * @param           {(string|string)} [input]            - value to be set as modal input value.
   * @example                                              - (1) editable(theEditableDiv, "none");
   * @example                                              - (2) editable("promise", "How can I help you?");
   * @returns         (void|string)                        - updates the element |or| returns a promise of the fetched data.
   * @exception                                            - if the first argument is neither HTMLElement or string.
   */
  this.editable = (elementOrPromise, defaultOrClass, title, paragraph, input) => {
    if (parts.modal.backdrop === null) return false;
    // reset elements event (e.g. onclick) property each time the function is called, addEventListener
    // would've been problematic for this use case or binding should've happened out of this scope

    function textHolders(heading, message, text, current) {
      if (heading || heading === '') parts.modal.heading.textContent = heading;
      if (message || message === '') parts.modal.message.textContent = message;
      if (current || current === '') parts.modal.current.textContent = current;
      if (text || text === '') parts.modal.text.value = text;
    } 

    let heading = (title && title.trim().length > 0) 
      ? title
      : L10N.generic.editable.title[LANG];
    let message = paragraph ? paragraph : '';
    let text = input ? input : '';

    parts.modal.backdrop.onclick = (event) => {
      if (event.target === parts.modal.backdrop) {
        if (parts.modal.backdrop.classList.contains(defaultOrClass)) {
          parts.modal.backdrop.classList.remove(defaultOrClass);
        }
        parts.modal.backdrop.classList.remove('open');
        textHolders(null, '', '', '');
      }
    }
    parts.modal.form.onkeydown = (event) => {
      // on ESC (close)
      if (event.keyCode === 27) {
        parts.modal.backdrop.click();
      }
    }
    parts.modal.text.onkeydown = (event) => {
      // on ENTER (submit)
      if (event.keyCode === 13) {
        event.preventDefault();
        parts.modal.submit.click();
      }
    }
    parts.modal.cancel.onclick = () => {
      parts.modal.backdrop.click();
    }
    
    // check type of first argument if it's a string
    // check if it's equal to promise otherwise throw an error
    // if nested condition is truly, show modal variant 2 and
    // return a promise of the fetched data from the input
    if (typeof elementOrPromise === 'string') {
      if (elementOrPromise === 'promise') {
        return new Promise((resolve, reject) => {
          parts.modal.backdrop.classList.add('open', defaultOrClass);
          textHolders(heading, message, text, '');
          setTimeout(() => parts.modal.text.focus(), 500);
          let request = setInterval(() => {
            parts.modal.submit.onclick = () => {
              // resolve the promise if value is fetched otherwise reject
              // in both cases reset the modal to the default state
              if (parts.modal.text.value.length > 0) {
                clearInterval(request);
                resolve(parts.modal.text.value.trim());
              } else {
                clearInterval(request);
                reject(L10N.generic.editable.error[LANG]);
              }
              parts.modal.backdrop.classList.remove('open', defaultOrClass);
              textHolders(null, '', '', '');
            }
            // stop fetching if the on cancel/close
            if (!parts.modal.backdrop.classList.contains('open')) {
              clearInterval(request);
              reject(L10N.generic.editable.error[LANG]);
            }
          }, 100);
        });
        // return value (the promise), it must be processed further at the function's call
      } else throw new Error('Unknown argument!');
    } else if (elementOrPromise instanceof HTMLElement) {
      // if first argument is an html element 
      // bind a click event to it to show modal
      elementOrPromise.addEventListener("click", () => {
        parts.modal.backdrop.classList.add('open');
        textHolders(heading, message, text, null);
        setTimeout(() => parts.modal.text.focus(), 500);
        // check if the current value element exists 
        if (parts.modal.current) {
          if (elementOrPromise.innerText === defaultOrClass) {
            textHolders(null, null, null, L10N.generic.editable.default[LANG]);
          } else if (elementOrPromise.innerText === "") {
            textHolders(null, null, null, L10N.generic.editable.empty[LANG]);
          } else {
            textHolders(null, null, null, elementOrPromise.innerText);
          }
        }
        // set new submitted text as elements inner text
        parts.modal.submit.onclick = () => {
          elementOrPromise.innerText = parts.modal.text.value.trim();
          parts.modal.backdrop.classList.remove('open');
          textHolders(null, '', '', '');
          THIS.notify(L10N.generic.editable.message[LANG]);
        }
      });
    } else throw new Error('Unknown argument!');
  };

  /**
   * @method          exportFile
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {string}       content       - content of the file.
   * @param           {string}       fileName      - wished file name (comes as prefix + date).
   * @param           {string}       fileExtension - file extension (with ".").
   * @param           {string}       mime          - mime type.
   * @returns         void                         - assigns the blob to the download link and clicks it.
   */
  this.exportFile = (content, fileName, fileExtension, mime) => {
    // make a download link if there isn't any
    if (parts.downloadLink === null) {
      parts.downloadLink = THIS.appendTo(document.body, 'A', {
        style: 'display:none;'
      });
    }
    // instantiate a blob and pass it the required arguments
    const file = new Blob([content], { type: mime });
    // format file name, prepare download link and download
    const date = new Date();
    const _ = "___";
    const suffix = _ + date.toDateString().split(/\s+/g).join("_") + _ + date.getTime();
    parts.downloadLink.href = URL.createObjectURL(file);
    // make sure the file extension has a dot
    parts.downloadLink.download = fileExtension.charAt(0) === "."
      ? fileName + suffix + fileExtension 
      : fileName + suffix + "." + fileExtension;
    parts.downloadLink.click();
    THIS.notify(THIS.interpolate(L10N.generic.exportFile.message[LANG], fileExtension));
  };

  /**
   * @method          extractFromHTML
   * @memberof        Eyeful.Generic
   * @access          public
   * @param           {array.<object>} htmlArray     - array of html elements.
   * @param           {string}         returnType    - string data type ("array" or "object").
   * @param           {boolean}        [jsonBoolean] - wether the return type should be stringified or not.
   * @returns         (array|object|string)          - assigns the blob to the download link and clicks it.
   * @exception       {Error}                        - if the first is not an array
   * @exception       {Error}                        - if the second argument is undefined
   * @exception       {Error}                        - if the the second argument is a supported type.
   */
  this.extractFromHTML = (htmlArray, returnType, jsonBoolean = false) => {
    // make sure at least the required arguments are passed
    if (!htmlArray instanceof Array) throw new Error("First argument must be an array!");
    else if (returnType === undefined) throw new Error("Second argument is required.");
    let final;
    // recheck arguments against unexpected values
    if (returnType === "object") final = new Object();
    else if (returnType === "array") final = new Array();
    else throw new Error("The second argument is not a supported type.");
    // initialize the authentication object
    let auth = {
      userId: client.userId, 
      sessionId: client.sessionId, 
      date: launchTime 
    };
    // add the authentication object to the returned object
    final[0] = auth;
    for (let i = 0; i < htmlArray.length; i++) {
      // loop throw elements and clone their dataset object
      let object = JSON.parse(JSON.stringify(htmlArray[i].dataset));
      // define a content property and add it to the cloned object
      object.content = [];
      for (let j = 0; j < htmlArray[i].children.length; j++) {
        // loop throw elements children and get their text content 
        // push it to the content array in the cloned object
        object.content.push(htmlArray[i].children[j].textContent);
        if (j + 1 === htmlArray[i].children.length) {
          // if it's the last iteration check the return type and push it 
          // or define it as an object property if return type == 'object'
          if (returnType === "object") {
            // order contents by iteration number e.g.: {"0": {*}, "1": {*}, ...};
            Object.defineProperty(final, i + 1, {
              value: object,
              writable: true,
              enumerable: true,
              configurable: false
            });
          } else final.push(object);
        }
      }
    }
    // if json boolean is true return json of the value
    // otherwise return it as ajavascript live object (or array)
    return jsonBoolean === true ? JSON.stringify(final) : final;
  };

  /** 
   * @memberof        Eyeful.Generic
   * @access          public
   * @property        {object}         parts    - assign parts to the class instance.
   * @property        {object}         language - contains getter and setter.
   * @property        {array}          imports  - contains getter.
   * @property        {object}         client   - contains getter and setter.
   * @summery defining getters and setter and some public variables on the class instance.
   */
  Object.defineProperties(this, {
    parts: {
      value: parts,
      writable: false,
      enumerable: false,
      configurable: false
    },
    imports: {
      get() { return imports; },
      enumerable: false,
      configurable: false
    },
    launchTime: {
      get() { return launchTime; },
      enumerable: false,
      configurable: false
    },
    language: {
      get() { return language; },
      set(key) { language.key = key; },
      enumerable: false,
      configurable: false
    },
    client: {
      get() { return client; },
      set(id) { client.userId = id; },
      enumerable: false,
      configurable: false
    }
  });
  
  /**
   * @function       iife
   * @memberof       Eyeful.Generic
   * @access         private
   * @returns        void           undefined
   * @description invokes private methods, binds events to some elements, logs app successful start.
   */
  const iife = (function() {
    _clientCheck();
    _jsonParser();
    THIS.notify(L10N.generic.app.launch.notification[LANG], 0, 'bar');
  })();
}