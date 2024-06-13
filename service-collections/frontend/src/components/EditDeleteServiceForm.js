import React, { useState } from 'react';
import './styles/EditDeleteServiceForm.css';
function EditDeleteServiceForm({ serviceName, initialData, onClose, onServiceUpdated, onServiceDeleted }) {
  const [serviceDisplayName, setServiceDisplayName] = useState(initialData.serviceDisplayName || '');
  const [serviceDescription, setServiceDescription] = useState(initialData.serviceDescription || '');

  const handleEditService = async (event) => {
    event.preventDefault();
  
    const requestBody = {
      serviceDisplayName,
      serviceDescription,
    };
  
    try {
      const response = await fetch(`/api/service-update/${serviceName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update service.');
      }
  
      const updatedService = await response.json();
      onServiceUpdated(updatedService);
  
      setServiceDisplayName(updatedService.name);
      onClose();
      window.location.href = `/services/${updatedService.name}`;
    } catch (error) {
      console.error('Error updating service:', error);
    }
  };

  const handleDeleteService = async () => {
    try {
      const response = await fetch(`/api/service-delete/${serviceName}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete service.');
      }

      onServiceDeleted(serviceName);
      onClose();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <form className="service-form" onSubmit={handleEditService}>
          <div className="input-group">
            <label htmlFor="service_display_name">Service name:</label><br />
            <input
              required
              type="text"
              id="service_display_name"
              value={serviceDisplayName}
              onChange={(e) => setServiceDisplayName(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="service_description">Service description:</label><br />
            <textarea
              required
              type="text"
              id="service_description"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
            />
          </div>
          <div className="buttons">
            <button className='button-cancel' type="button" onClick={onClose}>Cancel</button>
            <button className='button-save' type="submit">Save</button>
            <button className='button-delete' type="button" onClick={handleDeleteService}>Delete</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditDeleteServiceForm;
