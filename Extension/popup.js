const renderSessions = () => {
  chrome.storage.sync.get(["sessions"], storage => {
    document.getElementById("sessions").innerHTML = "";

    if (storage.sessions) {
      storage.sessions.forEach(session => {
        let divSession = document.createElement("div");
        divSession.classList.add("session");
        divSession.setAttribute("links", JSON.stringify(session.tabs));
        divSession.setAttribute("id", session.id);
        divSession.setAttribute("name", session.name);

        let divSessionContent = document.createElement("div");
        divSessionContent.onclick = openSessionTabs;
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
        divSessionActions.appendChild(createDeleteIcon(session.id));
        divSessionActions.appendChild(createMoreIcon(session.id));
        divSession.appendChild(divSessionActions);

        document.getElementById("sessions").appendChild(divSession);
      });
    }
  });
};

document.addEventListener("DOMContentLoaded", renderSessions);

document.getElementById("addSession").addEventListener("click", e => {
  e.preventDefault();

  if (document.getElementById("newSession").style.display === "none") {
    document.getElementById("newSession").style.display = "flex";
    document.getElementById("inputNewSession").focus();
  }
});

document.getElementById("inputNewSession").addEventListener("keypress", e => {
  if (e.key === 'Enter') {
    e.preventDefault;
    storageCurrentTabs(e.target.value);
  }
});

document.getElementById("btnNewSession").addEventListener("click", e => {
  e.preventDefault;
  storageCurrentTabs(document.getElementById("inputNewSession").value);
});

document.getElementById("btnBackSessions").addEventListener("click", e => {
  document.getElementById("sessions-page").classList.add("show");
  document.getElementById("links-page").classList.remove("show");
  document.getElementById("linksList").innerHTML = "";
});

document.getElementById("openSessionName").addEventListener("focus", e => e.target.select());

document.getElementById("openSessionName").addEventListener("blur", e => {
  chrome.storage.sync.get(["sessions"], (storage) => {
    let session_id = e.target.getAttribute("session_id");
    let newName = e.target.textContent ? e.target.textContent : e.target.innerText;

    let newSessions = storage.sessions.map(session => ({
      id: session.id,
      name: (session.id == session_id) ? newName : "batata",
      tabsCount: session.tabsCount,
      tabs: session.tabs
    }));

    console.dir(newSessions);

    chrome.storage.sync.set({ sessions: newSessions }, renderSessions);
  });
});

const storageCurrentTabs = (newSession) => {
  document.getElementById("newSession").style.display = "none";
  document.getElementById("inputNewSession").value = "";

  chrome.tabs.query({currentWindow: true, windowType: "normal"}, tabs => {
    let tabsForSave = tabs.map(tab => ({id: tab.id, title: tab.title, url: tab.url}));

    chrome.storage.sync.get(["sessions"], (storage) => {
      let newSessions = [];

      if (storage.sessions !== undefined) {
        newSessions = storage.sessions.length > 0 ? storage.sessions : [];
      }

      newSessions.push({ id: Math.random().toString(16).slice(2), name: newSession, tabsCount: tabsForSave.length, tabs: tabsForSave });
      chrome.storage.sync.set({ sessions: newSessions }, renderSessions);
    });
  });
};

const openSessionTabs = (e) => {
  e.preventDefault();

  let urls = document.querySelectorAll(`.session[session_id='${e.currentTarget.getAttribute("session_id")}']`)[0].getAttribute("links");
  urls = JSON.parse(urls).map(link => (link.url));

  chrome.tabs.query({currentWindow: true}, (tabs) => {
    if (tabs.length === 1) {
      if (tabs[0].url == "chrome://newtab/") {
        chrome.tabs.remove(tabs[0].id);

        JSON.parse(urls).forEach(link => {
          chrome.tabs.create({url: link, active: false});
        });
      } else {
        chrome.windows.create({focused: true, state: "maximized", url: urls});
      }
    } else {
      chrome.windows.create({focused: true, state: "maximized", url: urls});
    }
  });
}

const createDeleteIcon = session_id => {
  let divIconDelete = document.createElement("div");
  divIconDelete.classList.add("deleteIcon");
  divIconDelete.setAttribute("session_id", session_id);
  divIconDelete.addEventListener("click", e => {
    chrome.storage.sync.get(["sessions"], storage => {
      newSessions = storage.sessions.length > 0 ? storage.sessions : [];

      newSessions = newSessions.filter(sessionFilter => {
        return sessionFilter.id !== e.target.getAttribute("session_id");
      });

      chrome.storage.sync.set({ sessions: newSessions }, renderSessions);
    });
  }, false);

  return divIconDelete;
}

const createMoreIcon = session_id => {
  let divIconMore = document.createElement("div");
  divIconMore.classList.add("moreIcon");
  divIconMore.setAttribute("session_id", session_id);

  divIconMore.addEventListener("click", e => {
    document.getElementById("linksList").innerHTML = "";
    document.getElementById("links-page").classList.add("show");
    document.getElementById("sessions-page").classList.remove("show");

    let session = document.querySelectorAll(`.session[id='${e.target.getAttribute("session_id")}']`)[0]
    let links= JSON.parse(session.getAttribute("links"))
    let sessionName = session.getAttribute("name")

    document.getElementById("openSessionName").textContent = sessionName;
    document.getElementById("openSessionName").setAttribute("session_id", session_id);
    links.forEach(link => {
      let div = document.createElement("div");
      div.classList.add("linkDiv");

      let a = document.createElement("a");
      a.classList.add("bold");
      a.href = "#";
      a.addEventListener(
        "click",
        function (e) {
          e.preventDefault();
          chrome.tabs.create({url: link.url, active: true});
        },
        false
      );
      a.textContent = link.url.replace("https://", "").replace("http://", "").replace(/\/$/, "");
      div.appendChild(a);

      document.getElementById("linksList").appendChild(div);
    });
  });

  return divIconMore;
}
