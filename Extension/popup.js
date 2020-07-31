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
        newSessions.push({ id: Math.random().toString(16).slice(2) * 100, name: newSession, tabsCount: tabsCount, tabs: tabsForSave });
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
        divSession.addEventListener("onclick", (e) => openTabs(e), false);
        divSession.setAttribute("links", JSON.stringify(linksToOpen));
        divSession.classList.add("session");

        let divSessionContent = document.createElement("div");
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
        divIconDelete.setAttribute("session_id", session["id"]);
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

        divSession.appendChild(divSessionActions);

        document.getElementById("sessions").appendChild(divSession);

        var listOfSessionLink = document.getElementsByClassName("session");
        for (let item of listOfSessionLink) {
          item.addEventListener(
            "click",
            function (e) {
          chrome.windows.create({
                focused: true,
                state: "maximized",
                url: JSON.parse(item.getAttribute("links")),
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

  document.getElementById("buttonNewSession").addEventListener(
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
