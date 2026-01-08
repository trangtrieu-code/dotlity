(function () {

  // Constants
  const STORAGE_KEY = 'dotlity-notes';

  // DOM refs
  const notesList = document.getElementById('notesList');
  const notesAddBtn = document.getElementById('notesAddBtn');
  const notesPlaceholder = document.getElementById('notesPlaceholder');
  const notesEditorWrap = document.getElementById('notesEditorWrap');
  const notesEditorHeader = document.getElementById('notesEditorHeader');
  const notesTitleInput = document.getElementById('notesTitleInput');
  const notesContentInput = document.getElementById('notesContentInput');
  const notesFullscreenBtn = document.getElementById('notesFullscreenBtn');
  const notesDeleteBtn = document.getElementById('notesDeleteBtn');
  const notesPopup = document.getElementById('notesPopup');
  const notesPopupClose = document.getElementById('notesPopupClose');
  const notesPopupTitleInput = document.getElementById('notesPopupTitleInput');
  const notesPopupContentInput = document.getElementById('notesPopupContentInput');
  const confirmModal = document.getElementById('confirmModal');
  const confirmTitle = document.getElementById('confirmTitle');
  const confirmMessage = document.getElementById('confirmMessage');
  const confirmCancel = document.getElementById('confirmCancel');
  const confirmOk = document.getElementById('confirmOk');

  // Check if DOM refs are available
  if (!notesList || !notesEditorWrap) return;

  // Selected note (its id), or null if none
  let selectedId = null;

  // Load from / save to localStorage
  function loadNotes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  // Save notes to localStorage
  function saveNotes(notes) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {}
  }

  // Render the sidebar list
  function renderList() {
    const notes = loadNotes();
    notesList.innerHTML = '';

    // Render notes
    notes.forEach(function (note) {
      // Note item
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'notes-list-item w-full text-left px-3 py-2 rounded-lg text-sm truncate transition-colors';
      // Set selected note style
      if (note.id === selectedId) {
        item.classList.add('bg-slate-200', 'dark:bg-slate-700', 'text-slate-900', 'dark:text-slate-100');
      } else {
        item.classList.add('text-slate-700', 'dark:text-slate-200', 'hover:bg-slate-100', 'dark:hover:bg-slate-800');
      }
      item.textContent = note.title || 'Untitled';
      item.setAttribute('data-id', note.id);
      item.addEventListener('click', function () {
        selectNote(note.id);
      });
      notesList.appendChild(item);
    });
  }

  // Add a new note
  function addNote() {
    const notes = loadNotes();
    // Generate a new note id
    const id = 'note-' + Date.now();
    // Create a new note
    const newNote = { id: id, title: 'Untitled', content: '' };
    notes.unshift(newNote);
    saveNotes(notes);
    selectedId = id;
    renderList();
    showEditor(newNote);
  }

  // Select a note: show it in the editor
  function selectNote(id) {
    selectedId = id;
    renderList();
    const notes = loadNotes();
    const note = notes.find(function (n) { return n.id === id; });
    if (note) {
      showEditor(note);
    } else {
      showPlaceholder();
    }
  }

  // Show placeholder
  function showPlaceholder() {
    notesPlaceholder.classList.remove('hidden');
    notesPlaceholder.classList.add('flex');
    notesEditorWrap.classList.add('hidden');
    notesEditorHeader.classList.add('hidden');
  }

  // Show editor
  function showEditor(note) {
    notesPlaceholder.classList.add('hidden');
    notesPlaceholder.classList.remove('flex');
    notesEditorWrap.classList.remove('hidden');
    notesEditorHeader.classList.remove('hidden');
    notesTitleInput.value = note.title || '';
    notesContentInput.value = note.content || '';
    notesTitleInput.setAttribute('data-note-id', note.id);
    notesContentInput.setAttribute('data-note-id', note.id);
  }

  // Edit: auto-save when user types (save after a short delay so we don’t save on every key)
  let saveTimeout = null;

  function scheduleSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(function () {
      saveTimeout = null;
      saveCurrentNote();
    }, 400);
  }

  // Save current note
  function saveCurrentNote() {
    const id = notesTitleInput.getAttribute('data-note-id');
    if (!id) return;
    const notes = loadNotes();
    const idx = notes.findIndex(function (n) { return n.id === id; });
    if (idx === -1) return;
    notes[idx].title = (notesTitleInput.value || '').trim() || 'Untitled';
    notes[idx].content = notesContentInput.value || '';
    saveNotes(notes);
    renderList();
  }

  // Delete: show confirm modal, then delete if user confirms
  let deleteConfirmCallback = null;

  function openConfirm(title, message, onConfirm) {
    if (confirmTitle) confirmTitle.textContent = title || 'Delete?';
    if (confirmMessage) confirmMessage.textContent = message || 'This action cannot be undone.';
    deleteConfirmCallback = onConfirm;
    if (confirmModal) confirmModal.classList.remove('hidden');
  }

  // Close confirm modal
  function closeConfirm() {
    deleteConfirmCallback = null;
    if (confirmModal) confirmModal.classList.add('hidden');
  }

  // Delete current note
  function deleteCurrentNote() {
    const id = notesTitleInput.getAttribute('data-note-id');
    if (!id) return;
    openConfirm('Delete note?', 'This note will be removed.', function () {
      const notes = loadNotes().filter(function (n) { return n.id !== id; });
      saveNotes(notes);
      selectedId = notes.length > 0 ? notes[0].id : null;
      closeConfirm();
      renderList();
      if (selectedId) {
        selectNote(selectedId);
      } else {
        showPlaceholder();
      }
    });
  }

  // Confirm modal events
  if (confirmCancel) confirmCancel.addEventListener('click', closeConfirm);
  if (confirmOk) confirmOk.addEventListener('click', function () {
    if (deleteConfirmCallback) deleteConfirmCallback();
  });

  // Popup (zoom view): open current note in a popup; close copies content back
  function openPopup() {
    const id = notesTitleInput.getAttribute('data-note-id');
    if (!id) return;
    const notes = loadNotes();
    const note = notes.find(function (n) { return n.id === id; });
    if (!note) return;
    notesPopupTitleInput.value = note.title || '';
    notesPopupContentInput.value = note.content || '';
    notesPopupTitleInput.setAttribute('data-note-id', id);
    notesPopupContentInput.setAttribute('data-note-id', id);
    if (notesPopup) notesPopup.classList.remove('hidden');
  }

  // Close popup
  function closePopup() {
    const id = notesPopupTitleInput.getAttribute('data-note-id');
    if (id) {
      const notes = loadNotes();
      const idx = notes.findIndex(function (n) { return n.id === id; });
      if (idx !== -1) {
        notes[idx].title = (notesPopupTitleInput.value || '').trim() || 'Untitled';
        notes[idx].content = notesPopupContentInput.value || '';
        saveNotes(notes);
      }
    }
    if (notesPopup) notesPopup.classList.add('hidden');
    renderList();
    if (selectedId) {
      const notes = loadNotes();
      const note = notes.find(function (n) { return n.id === selectedId; });
      if (note) {
        notesTitleInput.value = note.title || '';
        notesContentInput.value = note.content || '';
      }
    }
  }

  // Popup events
  if (notesPopupClose) notesPopupClose.addEventListener('click', closePopup);
  if (notesPopup) {
    notesPopup.addEventListener('click', function (e) {
      if (e.target === notesPopup) closePopup();
    });
  }

  // Wire events
  if (notesAddBtn) notesAddBtn.addEventListener('click', addNote);
  if (notesTitleInput) {
    notesTitleInput.addEventListener('input', scheduleSave);
    notesTitleInput.addEventListener('blur', saveCurrentNote);
  }
  if (notesContentInput) {
    notesContentInput.addEventListener('input', scheduleSave);
    notesContentInput.addEventListener('blur', saveCurrentNote);
  }
  if (notesFullscreenBtn) notesFullscreenBtn.addEventListener('click', openPopup);
  if (notesDeleteBtn) notesDeleteBtn.addEventListener('click', deleteCurrentNote);

  // Start with placeholder if no note selected
  renderList();
  if (!selectedId) showPlaceholder();
})();
