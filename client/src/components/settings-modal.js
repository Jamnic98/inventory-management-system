import React from 'react';
import SettingsTabs from './settings-tabs.js';
import SimpleModal from './simple-modal.js';

export default function SettingsModal(props) {
  const {
    tree,
    setTree,
    isOpen,
    closeSettings,
    emails,
    setEmails,
    addEmail,
    deleteEmailById,
  } = props;

  const modalStyle = { maxWidth: '450px', width: '80%' };

  return (
    <SimpleModal
      title='Settings'
      isOpen={isOpen}
      closeModal={closeSettings}
      style={modalStyle}
    >
      <SettingsTabs
        tree={tree}
        setTree={setTree}
        emails={emails}
        setEmails={setEmails}
        addEmail={addEmail}
        deleteEmailById={deleteEmailById}
      />
    </SimpleModal>
  );
}
