const saveNewSession = newSessionName => {
  document.getElementById("saveNewSession").style.display = "none";
  document.getElementById("newSessionName").value = "";

  chrome.tabs.query({currentWindow: true, windowType: "normal"}, tabs => {
    let tabsForSave = tabs.map(tab => ({
      id: String(tab.id),
      title: tab.title,
      url: tab.url,
      favIconUrl: tab.favIconUrl ? tab.favIconUrl : ""
    }));

    chrome.storage.sync.get(["sessions"], (storage) => {
      let newSessions = [];

      if (storage.sessions !== undefined) {
        newSessions = storage.sessions.length > 0 ? storage.sessions : [];
      }

      newSessions.push({ id: Math.random().toString(16).slice(2), name: newSessionName, tabsCount: tabsForSave.length, tabs: tabsForSave });
      chrome.storage.sync.set({ sessions: newSessions }, renderSessions);
    });
  });
};

const openSession = e => {
  e.preventDefault();

  let sessionContent = e.currentTarget || e.target; 

  chrome.storage.sync.get(["sessions"], storage => {
    let session = storage.sessions.find(session => session.id === sessionContent.getAttribute("session_id"));

    chrome.tabs.query({currentWindow: true}, tabs => {
      if (tabs.length === 1) {
        if (tabs[0].url == "chrome://newtab/") {
          chrome.tabs.remove(tabs[0].id);

          session.tabs.forEach(tab => {
            chrome.tabs.create({url: tab.url, active: false});
          });
        } else {
          chrome.windows.create({focused: true, state: "maximized", url: session.tabs.map(tab => tab.url)});
        }
      } else {
        chrome.windows.create({focused: true, state: "maximized", url: session.tabs.map(tab => tab.url)});
      }
    });
  });
};

const deleteSession = session_id => {
  chrome.storage.sync.get(["sessions"], storage => {
    chrome.storage.sync.set({
      sessions: storage.sessions.filter(sessionFilter => sessionFilter.id !== session_id)
    }, renderSessions);
  });
};

const renderSessions = () => {
  chrome.storage.sync.get(["sessions"], storage => {
    document.getElementById("sessions").innerHTML = "";

    if (storage.sessions) {
      storage.sessions.forEach(session => {
        let divSession = document.createElement("div");
        divSession.classList.add("session");
        divSession.setAttribute("id", session.id);

        let divSessionContent = document.createElement("div");
        divSessionContent.addEventListener("click", e => openSession(e), true);
        divSessionContent.setAttribute("session_id", session.id);
        divSessionContent.classList.add("content");

        let pSessionName = document.createElement("p");
        pSessionName.textContent = session.name;
        pSessionName.classList.add("bold");
        divSessionContent.appendChild(pSessionName);

        let spanTabsCount = document.createElement("span");
        spanTabsCount.textContent = session.tabsCount + " tabs";
        divSessionContent.appendChild(spanTabsCount);

        divSession.appendChild(divSessionContent);

        let divSessionActions = document.createElement("div");
        divSessionActions.classList.add("actions");

        let divIconDelete = document.createElement("div");
        divIconDelete.classList.add("deleteIcon");
        divIconDelete.classList.add("icon");
        divIconDelete.addEventListener("click", () => deleteSession(session.id));
        divSessionActions.appendChild(divIconDelete);

        let divIconMore = document.createElement("div");
        divIconMore.classList.add("moreIcon");
        divIconMore.classList.add("icon");
        divIconMore.addEventListener("click", () => renderTabs(session.id));
        divSessionActions.appendChild(divIconMore);

        divSession.appendChild(divSessionActions);

        document.getElementById("sessions").appendChild(divSession);
      });
    }
  });
};

const renderTabs = session_id => {
  chrome.storage.sync.get(["sessions"], storage => {
    let session = storage.sessions.find(session => session.id === session_id);
  
    document.getElementById("selectedSessionName").value = session.name;
    document.getElementById("selectedSessionName").setAttribute("session_id", session_id);

    document.getElementById("tabs").innerHTML = "";
    document.getElementById("tabs-page").classList.add("show");
    document.getElementById("sessions-page").classList.remove("show");

    session.tabs.forEach(tab => {
      let div = document.createElement("div");
      div.setAttribute("id", tab.id);
      div.classList.add("tab");

      let a = document.createElement("a");
      a.classList.add("bold");
      a.href = tab.url;
      a.addEventListener("click", e => {
        e.preventDefault();
        chrome.tabs.create({url: tab.url, active: true});
      });
      a.textContent = tab.title;

      let favicon = document.createElement("div");
      favicon.classList.add("icon");
      favicon.classList.add("favicon");
      favicon.style.backgroundImage = `url(${tab.favIconUrl}`;
      a.prepend(favicon);

      div.appendChild(a);

      let divIconDeletetab = document.createElement("div");
      divIconDeletetab.classList.add("deleteIcon");
      divIconDeletetab.classList.add("icon");
      divIconDeletetab.addEventListener("click", () => deleteTab(tab.id, session_id));
      div.appendChild(divIconDeletetab);

      document.getElementById("tabs").appendChild(div);
    });
  });
}

const deleteTab = (tab_id, session_id) => {
  chrome.storage.sync.get(["sessions"], storage => {
    let newSessions = storage.sessions
    let sessionIndex = newSessions.findIndex(session => session.id === session_id);

    newSessions[sessionIndex].tabs = newSessions[sessionIndex].tabs.filter(tab => tab.id !== tab_id)
    newSessions[sessionIndex].tabsCount -= 1;

    document.querySelectorAll(`.tab[id='${tab_id}']`)[0].remove()

    chrome.storage.sync.set({ sessions: newSessions }, renderSessions);
  });
};

document.addEventListener("DOMContentLoaded", renderSessions);

document.getElementById("btnAddSession").addEventListener("click", e => {
  e.preventDefault();

  if (document.getElementById("saveNewSession").style.display === "none") {
    document.getElementById("saveNewSession").style.display = "flex";
    document.getElementById("newSessionName").focus();
  } else {
    document.getElementById("saveNewSession").style.display = "none";
  }
});

document.getElementById("newSessionName").addEventListener("keypress", e => {
  if (e.key === 'Enter') {
    e.preventDefault;
    saveNewSession(e.target.value);
  }
});

document.getElementById("btnSaveNewSession").addEventListener("click", e => {
  e.preventDefault;
  saveNewSession(document.getElementById("newSessionName").value);
});

document.getElementById("btnBackToSessions").addEventListener("click", e => {
  document.getElementById("sessions-page").classList.add("show");
  document.getElementById("tabs-page").classList.remove("show");
  document.getElementById("tabs").innerHTML = "";
});

document.getElementById("selectedSessionName").addEventListener("focus", e => e.target.select());

document.getElementById("selectedSessionName").addEventListener("keypress", e => {
  if (e.key === 'Enter') {
    e.preventDefault;
    e.target.blur();
  }
});

document.getElementById("selectedSessionName").addEventListener("blur", e => {
  chrome.storage.sync.get(["sessions"], (storage) => {
    let sessionIndex = storage.sessions.findIndex(session => session.id === e.target.getAttribute("session_id"));

    storage.sessions[sessionIndex].name = e.target.value;

    chrome.storage.sync.set({ sessions: storage.sessions }, renderSessions);
  });
});
