(function () {
  const storageKey = "cyber-city-progress";
  const channel = "BroadcastChannel" in window
    ? new BroadcastChannel("cyber-city-progress")
    : null;

  function normalize(value) {
    const number = Number.parseInt(value, 10);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function localRead() {
    return normalize(localStorage.getItem(storageKey));
  }

  function notify(count) {
    channel?.postMessage(count);
    window.dispatchEvent(new CustomEvent("city-progress", { detail: count }));
  }

  async function request(action = "") {
    const base = String(window.CITY_PROGRESS_API || "").replace(/\/$/, "");
    if (!base) return null;

    const separator = action.includes("?") ? "&" : "?";
    const response = await fetch(`${base}${action}${separator}t=${Date.now()}`, {
      method: "GET",
      cache: "no-store"
    });

    if (!response.ok) throw new Error(`Progress API error: ${response.status}`);
    const data = await response.json();
    return normalize(data.count);
  }

  async function read() {
    try {
      const serverCount = await request();
      if (serverCount !== null) {
        localStorage.setItem(storageKey, serverCount);
        return serverCount;
      }
    } catch (error) {
      console.warn(error);
    }

    return localRead();
  }

  async function increment() {
    try {
      const serverCount = await request("/up");
      if (serverCount !== null) {
        localStorage.setItem(storageKey, serverCount);
        notify(serverCount);
        return serverCount;
      }
    } catch (error) {
      console.warn(error);
    }

    const count = localRead() + 1;
    localStorage.setItem(storageKey, count);
    notify(count);
    return count;
  }

  function subscribe(callback) {
    const onStorage = (event) => {
      if (event.key === storageKey) callback(normalize(event.newValue));
    };
    const onProgress = (event) => callback(normalize(event.detail));
    const onChannel = (event) => callback(normalize(event.data));

    window.addEventListener("storage", onStorage);
    window.addEventListener("city-progress", onProgress);
    channel?.addEventListener("message", onChannel);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("city-progress", onProgress);
      channel?.removeEventListener("message", onChannel);
    };
  }

  window.ProgressStore = { read, increment, subscribe };
}());
