import React from 'react';
import SettingsTabs from './settings-tabs.js';
import SimpleModal from './simple-modal.js';

export default function SettingsModal(props) {
  const { isOpen, closeSettings } = props;

  const modalStyle = { width: '85%', height: '500px' };

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
