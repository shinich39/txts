const { invoke, send, receive } = utils;

const header = document.getElementById("header");
const footer = document.getElementById("footer");
const seperator = document.getElementById("seperator");
const list = document.getElementById("list");
const result = document.getElementById("result");
let textFiles = [];

// initialize
receive("config", function(e, config) {
  if (config && config.header) {
    header.value = config.header;
  }
  if (config && config.footer) {
    footer.value = config.footer;
  }
  if (config && config.seperator) {
    seperator.value = config.seperator;
  }
});

function getTextFromFile(file) {
  return new Promise(function(resolve, reject) {
    const reader = new FileReader();
    reader.onload = function(e) {
      resolve(e.target.result);
    }
    reader.onerror = function(err) {
      reject(err);
    }
    reader.readAsText(file);
  });
}

function splitText(text) {
  text = text.toLowerCase()
    .replace(/\r\n/g, "\n");

  return splitFloat(text)
    .reduce(function(prev, curr) {
      if (strJs.isNumber(curr)) {
        prev.push(curr);
      } else {
        const temp = curr.split(/[\s\n\~\!\?\+\=\-\_\*\&\^\%\$\#\@\<\>\[\]\(\)\{\},.\/\\]+/g)
        prev = prev.concat(temp);
      }
      return prev;
    }, [])
    .filter(Boolean);
}

function convertText(file, text) {
  return text
    .replace(/\{index\}/g, "" + (file.index + 1))
    .replace(/\{type\}/g, file.type)
    .replace(/\{filename\}/g, file.name)
    .replace(/\{size\}/g, "" + file.size)
    .replace(/\{words\}/g, "" + file.words.length)
    .replace(/\{characters\}/g, "" + file.text.length)
}

function changeIndex(element, target) {
  const from = parseInt(element.getAttribute("data-index"));
  const to = parseInt(target.getAttribute("data-index"));
  
  textFiles[from].index = to;
  textFiles[to].index = from;

  textFiles = textFiles.sort(function(a, b) {
    return a.index - b.index;
  });

  renderList();
  renderResult();
}

function deleteFile(element) {
  const index = parseInt(element.getAttribute("data-index"));

  textFiles.splice(index, 1);

  textFiles = textFiles.map(function(file, index) {
    file.index = index;
    return file;
  });

  renderList();
  renderResult();
}

function renderList() {
  // clear
  list.innerHTML = "";

  for (let i = 0; i < textFiles.length; i++) {
    const file = textFiles[i];
    const wrapper = document.createElement("div");
    wrapper.className = "list-item d-f fd-r fx-sb fy-m ws-nw p-05 bb-1";
    wrapper.setAttribute("data-index", "" + i);
    const filename = document.createElement("div");
    filename.innerHTML = file.name;
    const btn = document.createElement("button");
    btn.className = "ml-05"
    btn.innerHTML = "X";
    btn.style.color = "red";

    wrapper.appendChild(filename);
    wrapper.appendChild(btn);

    list.appendChild(wrapper);

    // drag and drop event
    const dnd = new DnD(wrapper, true);
    dnd.end = function(e) {
      const _wrapper = e.target.closest("div.list-item");
      if (!_wrapper || _wrapper.isSameNode(wrapper)) {
        return;
      }
      changeIndex(wrapper, _wrapper);
    };

    // delete event
    btn.addEventListener("click", function(e) {
      deleteFile(wrapper);
    });
  }
}

function renderResult() {
  const h = header.value || null;
  const f = footer.value || null;
  const sep = seperator.value || null;

  const res = [];
  for (let i = 0; i < textFiles.length; i++) {
    const file = textFiles[i];

    if (h) {
      res.push(convertText(file, h));
    }

    res.push(file.text);

    if (f) {
      res.push(convertText(file, f));
    }

    if (sep && i < textFiles.length - 1) {
      res.push(convertText(file, sep));
    }
  }

  result.value = res.join("\n");
}

function preventDefault(e) {
  e.preventDefault();
}

async function dropHandler(e) {
  const files = e.dataTransfer.files;
  if (files.length < 1) {
    return;
  }

  const newFiles = [];
  for (const file of files) {
    // check type
    if (file.type !== "text/plain") {
      continue;
    }

    // check dupe
    if (!!textFiles.find(function(_file) {return _file.path === file.path;})) {
      continue;
    }

    const text = await getTextFromFile(file);

    const words = splitText(text);

    const newFile = {
      name: file.name,
      path: file.path,
      type: file.type,
      size: file.size,
      words: words,
      text: text,
    }

    newFiles.push(newFile);
  }

  textFiles = textFiles.concat(newFiles)
    .sort(function(a, b) {
      return strJs.compare(a.name, b.name);
    })
    .map(function(file, index) {
      file.index = index;
      return file;
    });

  renderList();
  renderResult();
}

window.addEventListener("dragover", preventDefault);
window.addEventListener("dragleave", preventDefault);
window.addEventListener("dragend", preventDefault);
window.addEventListener("drop", preventDefault);
window.addEventListener("drop", dropHandler);

[header, footer, seperator].forEach(function(element) {
  element.addEventListener("change", function() {

    // save config
    send("config", {
      header: header.value || null,
      footer: footer.value || null,
      seperator: seperator.value || null,
    });

    // re-render
    renderResult();
  });
});