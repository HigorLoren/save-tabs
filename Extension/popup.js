const addTabs = (newSession) => {
  document.getElementById("newSession").style.display = "none";
  document.getElementById("inputNewSession").value = "";

  let tabsForSave = [];
  let newSessions = [];
  let tabsCount = 0;

  chrome.tabs.query(
    {
      currentWindow: true,
      windowType: "normal",
    },
    (tabs) => {
      for (tab in tabs) {
        let tabForSave = {
          id: tabs[tab].id,
          title: tabs[tab].title,
          url: tabs[tab].url,
        };

        tabsCount += 1;

        tabsForSave.push(tabForSave);
      }

      chrome.storage.sync.get(["sessions"], (storage) => {
        if (storage["sessions"] !== undefined) {
          newSessions = storage["sessions"].length > 0 ? storage["sessions"] : [];
        }
        newSessions.push({ session_id: Math.random().toString(16).slice(2), name: newSession, tabsCount: tabsCount, tabs: tabsForSave });
        chrome.storage.sync.set({ sessions: newSessions }, loadSession);
      });
    }
  );
};

const loadSession = () => {
  document.getElementById("sessions").innerHTML = "";
  chrome.storage.sync.get(["sessions"], (result) => {
    if (result["sessions"]) {
      result.sessions.forEach((session) => {
        let linksToOpen = [];
        session["tabs"].forEach((tab) => {
          linksToOpen.push(tab["url"]);
        });

        let divSession = document.createElement("div");
        divSession.classList.add("session");
        divSession.setAttribute("links", JSON.stringify(linksToOpen));
        divSession.setAttribute("session_id", session["session_id"]);

        let divSessionContent = document.createElement("div");
        divSessionContent.addEventListener("onclick", (e) => openTabs(e), false);
        divSessionContent.setAttribute("session_id", session["session_id"]);
        divSessionContent.classList.add("divSessionContent");

        let pSessionName = document.createElement("p");
        pSessionName.textContent = session["name"];
        pSessionName.classList.add("bold");
        divSessionContent.appendChild(pSessionName);

        let spanTabsCount = document.createElement("span");
        spanTabsCount.textContent = session["tabsCount"] + " tabs";

        divSessionContent.appendChild(spanTabsCount);

        divSession.appendChild(divSessionContent);

        let divSessionActions = document.createElement("div");
        divSessionActions.classList.add("divSessionActions");

        let divIconDelete = document.createElement("div");
        divIconDelete.classList.add("deleteIcon");
        divIconDelete.setAttribute("session_id", session["session_id"]);
        divIconDelete.addEventListener(
          "click",
          function (e) {
            chrome.storage.sync.get(["sessions"], (storage) => {
              newSessions = storage["sessions"].length > 0 ? storage["sessions"] : [];
              newSessions = newSessions.filter((sessionFilter, i) => {
                return sessionFilter["id"] === e.target.getAttribute("session_id");
              });

              chrome.storage.sync.set({ sessions: newSessions }, loadSession);
            });
          },
          false
        );
        divSessionActions.appendChild(divIconDelete);
        
        let divIconMore = document.createElement("div");
        divIconMore.classList.add("moreIcon");
        divIconMore.setAttribute("session_id", session["session_id"]);
        divIconMore.addEventListener(
          "click",
          function (e) {
            document.getElementById("links-page").classList.add("show");
            document.getElementById("sessions-page").classList.remove("show");

            let linksJson = document.querySelectorAll(`.session[session_id='${e.target.getAttribute("session_id")}']`)[0].getAttribute("links")

            JSON.parse(linksJson).forEach(link => {
              let linkDiv = document.createElement("div");
              linkDiv.classList.add("linkDiv");
              linkDiv.textContent = link
              document.getElementById("linksList").appendChild(linkDiv);
            })
          },
          false
        );
        divSessionActions.appendChild(divIconMore);

        divSession.appendChild(divSessionActions);

        document.getElementById("sessions").appendChild(divSession);

        var listOfSessionLink = document.getElementsByClassName("divSessionContent");
        for (let item of listOfSessionLink) {
          item.addEventListener(
            "click",
            function (e) {
              e.preventDefault()

              let linksJson = document.querySelectorAll(`.session[session_id='${item.getAttribute("session_id")}']`)[0].getAttribute("links")

              chrome.tabs.query({currentWindow: true}, (tabs) => {
                if (tabs.length === 1) {
                  if (tabs[0].url == "chrome://newtab/") {
                    chrome.tabs.remove(tabs[0].id);
                    JSON.parse(linksJson).forEach(link => {
                      chrome.tabs.create({url: link, active: false});
                    });
                  } else {
                    chrome.windows.create({
                      focused: true,
                      state: "maximized",
                      url: JSON.parse(linksJson),
                    });
                  }
                } else {
                  chrome.windows.create({
                    focused: true,
                    state: "maximized",
                    url: JSON.parse(linksJson),
                  });
                }
              });
            },
            false
          );
        }
      });
    }
  });
};

document.addEventListener("DOMContentLoaded", function () {
  // chrome.storage.sync.set({ sessions: [] });
  loadSession();

  document.getElementById("inputNewSession").addEventListener(
    "keypress",
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault;
        addTabs(document.getElementById("inputNewSession").value);
      }
    },
    false
  );

  document.getElementById("btnNewSession").addEventListener(
    "click",
    (e) => {
      e.preventDefault;
      addTabs(document.getElementById("inputNewSession").value);
    },
    false
  );

  document.getElementById("addSession").addEventListener("click", () => {
    if (document.getElementById("newSession").style.display === "none") {
      document.getElementById("newSession").style.display = "flex";
      document.getElementById("inputNewSession").focus();
    }
  });
});
