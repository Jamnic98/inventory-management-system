import React from 'react';
import SettingsTabs from './settings-tabs.js';
import SimpleModal from './simple-modal.js';

export default function SettingsModal(props) {
  const { isOpen, closeSettings } = props;

  const modalStyle = { maxWidth: '400px', width: '80%', height: '500px' };

  return (
    <SimpleModal
      title='Settings'
      isOpen={isOpen}
      closeModal={closeSettings}
      style={modalStyle}
    >
      <SettingsTabs />
    </SimpleModal>
  );
}
