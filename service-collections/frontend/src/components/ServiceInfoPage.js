import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './styles/ServiceInfoPage.css';
import { ReactComponent as BackIcon } from './back.svg';
import EditDeleteServiceForm from './EditDeleteServiceForm'; 

function ServiceInfoPage() {
  const { serviceName } = useParams();
  const [serviceDisplayName, setServiceDisplayName] = useState(null);
  const [serviceDescription, setServiceDescription] = useState(null);
  const [servicePoints, setServicePoints] = useState([]);
  const [serviceLogo, setServiceLogo] = useState(null);
  const [expandedPointIndex, setExpandedPointIndex] = useState(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [paramName, setParamName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [authMethod, setAuthMethod] = useState('var1');
  const [authType, setAuthType] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [clientUrl, setClientUrl] = useState('');
  const [scope, setScope] = useState('');
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [authorizationContentType, setAuthorizationContentType] = useState('');
  const [editFormOpen, setEditFormOpen] = useState(false); 

  useEffect(() => {
    const fetchServiceInfo = async () => {
      try {
        const response = await fetch(`/api/services/${serviceName}`);
        const data = await response.json();
        setServiceDisplayName(data.serviceName);
        setServiceDescription(data.serviceDescription);
        setServicePoints(data.servicePoints);
        setServiceLogo(data.serviceLogo);
      } catch (error) {
        console.error('Error fetching service info:', error);
      }
    };

    fetchServiceInfo();
  }, [serviceName]);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.code === 'Escape') {
        setIsModalOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, []);

  const toggleExpand = (index) => {
    if (index === expandedPointIndex) {
      setExpandedPointIndex(null);
      setActiveButtonIndex(null);
    } else {
      setExpandedPointIndex(index);
      setActiveButtonIndex(index);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenModal = () => {
    setExpandedPointIndex(null);
    setActiveButtonIndex(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAddEndpoint = async (newEndpoint) => {
    try {
      const response = await fetch(`/api/services/${serviceName}/endpoints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEndpoint),
      });
      if (response.ok) {
        const updatedServicePoints = await response.json();
        setServicePoints(updatedServicePoints);
        handleCloseModal();
      } else {
        console.error('Error adding endpoint:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding endpoint:', error);
    }
  };

  const handleAuthTypeChange = (e) => {
    setAuthType(e.target.value);
  };

  const handleAuthChoiceChange = (e) => {
    setAuthMethod(e.target.value);
  };

  const handleNewServiceSubmit = async (event) => {
    event.preventDefault();
    let requestBody = { serviceName };
    let url;

    switch (authMethod) {
      case 'var2':
        requestBody.token = apiKey;
        requestBody.paramName = paramName;
        requestBody.auth_id = authType === 'Header' ? 1 : 2;
        url = '/api/create-auth-service';
        break;

      case 'var3':
        requestBody = {
          ...requestBody,
          clientId,
          clientSecret,
          clientUrl,
          authorizationContentType,
          authorizationUrl,
          scope
        };
        url = '/api/create-oauth-service';
        break;

      default:
        break;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to create service.');
      }

      console.log('Service created successfully.');
    } catch (error) {
      console.error('Error creating service:', error);
    }
    
    setShowForm(false);
  };

  const handleEditFormOpen = () => {
    setEditFormOpen(true);
  };
  
  const handleEditFormClose = () => {
    setEditFormOpen(false);
  };

  const handleServiceUpdated = (updatedService) => {
    setServiceDisplayName(updatedService.name); 
    setServiceDescription(updatedService.description); 
  };

  const handleServiceDeleted = (deletedServiceName) => {
    window.location.href = '/'; 
  };

  return (
    <div className="service-info-container">
      <div className="header">
        <div className="back-button">
          <a href="http://localhost:3000/" onClick={() => window.history.back()}>
            <BackIcon className="back-icon" title="Назад" />
          </a>
          <h1 className="service-title">Service details</h1>
        </div>
        <button className="edit-service-button" onClick={handleEditFormOpen}>Edit Service</button>
        {editFormOpen && ( 
          <EditDeleteServiceForm
            serviceName={serviceName}     
            initialData={{ serviceDisplayName, serviceDescription }}
            onClose={handleEditFormClose}
            onServiceUpdated={handleServiceUpdated}
            onServiceDeleted={handleServiceDeleted}
          />
        )}
        <button className="add-authorization-button" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отменить' : 'Добавить авторизацию'}
        </button>
      </div>
      <div className="container">
        <div className="image-container">
          <img src={serviceLogo} alt="Service" className="service-logo" />
        </div>
        <p className="service-name">{serviceDisplayName}</p>
      </div>
      <p className="service-description">{serviceDescription}</p>
      <h2 className="service-points-title">Service endpoints</h2>
      <button className="add-endpoint-button" onClick={handleOpenModal}>Add new endpoint</button>
      <ul className="service-points-list">
        {servicePoints.map((point, index) => (
          <ServicePoint
            key={index}
            point={point}
            isExpanded={index === expandedPointIndex}
            isActive={index === activeButtonIndex}
            toggleExpand={() => toggleExpand(index)}
            serviceName={serviceName}
            setServicePoints={setServicePoints}
          />
        ))}
      </ul>
      {isModalOpen && <AddEndpointModal onClose={handleCloseModal} onAdd={handleAddEndpoint} />}

      {showForm && (
        <div className="modal">
          <div className="modal-content">
            <form className="service-form" onSubmit={handleNewServiceSubmit}>
              <div className="input-group">
                <label htmlFor="field3">Метод авторизации:</label><br />
                <select
                  id="Authchoice"
                  value={authMethod}
                  onChange={handleAuthChoiceChange}
                >
				 <option value="var1">No authorization</option>
                  <option value="var2">Service</option>
                  <option value="var3">Oauth</option>
                </select>
              </div>

              {authMethod === 'var2' && (
                <div className='radio' id='checkcurcle'>
                  <div className='circle_group'>
                    <label>
                      <input
                        required
                        type="radio"
                        name="authType"
                        value="Header"
                        checked={authType === 'Header'}
                        onChange={handleAuthTypeChange}
                      />
                      Bearer
                    </label>
                    <label>
                      <input
                        required
                        type="radio"
                        name="authType"
                        value="Query"
                        checked={authType === 'Query'}
                        onChange={handleAuthTypeChange}
                      />
                      Query
                    </label>
                  </div>
                  <div className="input-group">
                    <label htmlFor="param_name">Parameter name:</label><br />
                    <input
                      required
                      type="text"
                      id="param_name"
                      value={paramName}
                      onChange={(e) => setParamName(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="apikey">Service token / API key:</label><br />
                    <input
                      required
                      type="text"
                      id="apikey"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {authMethod === 'var3' && (
                <div className='Oauth' id='Oauth'>
                  <div className="input-group">
                    <label htmlFor="client_id">Client ID:</label><br />
                    <input
                      required
                      type="text"
                      id="client_id"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="client_secret">Client Secret:</label><br />
                    <input
                      required
                      type="text"
                      id="client_secret"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="client_url">Client URL:</label><br />
                    <input
                      required
                      type="text"
                      id="client_url"
                      value={clientUrl}
                      onChange={(e) => setClientUrl(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="scope">Scope:</label><br />
                    <input
                      required
                      type="text"
                      id="scope"
                      value={scope}
                      onChange={(e) => setScope(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="authorization_url">Authorization URL:</label><br />
                    <input
                      required
                      type="text"
                      id="authorization_url"
                      value={authorizationUrl}
                      onChange={(e) => setAuthorizationUrl(e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label htmlFor="authorization_content_type">Authorization Content-Type:</label><br />
                    <input
                      required
                      type="text"
                      id="authorization_content_type"
                      value={authorizationContentType}
                      onChange={(e) => setAuthorizationContentType(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="buttons">
                <button type="button" onClick={() => setShowForm(false)}>Назад</button>
                <button type="submit">Добавить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}




function ServicePoint({ point, isExpanded, isActive, toggleExpand, updateServicePoint,  serviceName, setServicePoints }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedParameters, setEditedParameters] = useState(point.parameters || []);
  const [editedName, setEditedName] = useState(point.uri);
  const [editedDescription, setEditedDescription] = useState(point.description);
  const [changedParameters, setChangedParameters] = useState([]);
  const [parameterTypes, setParameterTypes] = useState([]);

  useEffect(() => {
    const fetchParameterTypes = async () => {
      try {
        const response = await fetch('/api/parameter-types');
        const types = await response.json();
        setParameterTypes(types);
      } catch (error) {
        console.error('Error fetching parameter types:', error);
      }
    };

    fetchParameterTypes();
  }, []);

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleParameterChange = (index, field, value) => {
    const newParameters = [...editedParameters];
    newParameters[index] = { ...newParameters[index], [field]: value };
    setEditedParameters(newParameters);

    if (!changedParameters.includes(index)) {
      setChangedParameters([...changedParameters, index]);
    }
  };

  const handleAddParameter = () => {
    const newParameter = { id: null, name: '', required: false, type: '', description: '' };
    setEditedParameters([...editedParameters, newParameter]);
    setChangedParameters([...changedParameters, editedParameters.length]);
  };

  const handleRemoveParameter = async (index) => {
    const parameterToRemove = editedParameters[index];

    if (parameterToRemove && parameterToRemove.id) {
      try {
        const response = await fetch(`/api/service-points/${point.id}/parameters/${parameterToRemove.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete parameter');
        }
      } catch (error) {
        console.error('Error deleting parameter:', error);
        return;
      }
    }

    const newParameters = editedParameters.filter((_, i) => i !== index);
    setEditedParameters(newParameters);
    setChangedParameters(changedParameters.filter(i => i !== index));
  };

  const handleRemoveServicePoint = async () => {
    try {
      const response = await fetch(`/api/service-points/${point.id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error('Failed to delete service point');
      }
  
      const updatedServicePointsResponse = await fetch(`/api/services/${serviceName}`);
      const updatedServicePointsData = await updatedServicePointsResponse.json();
      setServicePoints(updatedServicePointsData.servicePoints);
    } catch (error) {
      console.error('Error deleting service point:', error);
    }
  };

  const saveChanges = async () => {
    try {
      const updatedParametersToSend = changedParameters.map(index => editedParameters[index]).filter(param => param);

      const response = await fetch(`/api/service-points/${point.id}/parameters`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parameters: updatedParametersToSend,
          uri: editedName,
          description: editedDescription
        }),
      });

      if (response.ok) {
        const updatedParameters = await response.json();
        updateServicePoint(point.id, updatedParameters);
        setIsEditing(false);
        setChangedParameters([]);
      } else {
        console.error('Failed to update parameters:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating parameters:', error);
    }
  };

  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.code === 'Escape') {
        setIsEditing(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  return (
    <li className="service-point">
      <button className={`service-uri ${isActive ? 'active' : ''}`} onClick={toggleExpand}>
        {point.uri}
      </button>
      {isExpanded && (
        <div className="expanded-content">
          <h3 className="service-point-description">{point.description}</h3>
          <h3 className="service-parameters-title">Input parameters</h3>
          <button onClick={toggleEdit} className='edit-parameters-button'>Edit parameters</button>
          <table className="service-parameters-table">
            <thead>
              <tr>
                <th className='service-parameters-table-column'>Parameter name</th>
                <th className='service-parameters-table-column'>Required</th>
                <th className='service-parameters-table-column'>Parameter type</th>
                <th className='service-parameters-table-column'>Parameter description</th>
              </tr>
            </thead>
            <tbody>
              {editedParameters.map((parameter, index) => (
                <tr key={index} className="service-parameter">
                  <td className="parameter-name">{parameter.name}</td>
                  <td className="parameter-required">{parameter.required ? "Required" : "Optional"}</td>
                  <td className="parameter-type">{parameter.type}</td>
                  <td className="parameter-description">{parameter.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleRemoveServicePoint} className='delete-service-point-button'>Delete service endpoint</button>
          {isEditing && (
            <div className="edit-overlay">
              <div className="edit-parameters-form">
                <button className="close-button" onClick={toggleEdit}>&times;</button>
                <h3>Edit service point</h3>
                <div className="edit-endpoint">
                  <label className='edit-service-point-name'>
                    Name: <input type="text" value={editedName} onChange={(e) => setEditedName(e.target.value)} />
                  </label>
                  <label className='edit-service-point-description'>
                    Description: <textarea type="text" value={editedDescription} onChange={(e) => setEditedDescription(e.target.value)} />
                  </label>
                </div>
                <h3>Edit parameters</h3>
                <button className='edit-parameters-add-button' type="button" onClick={handleAddParameter}>Add parameter</button>
                <div className="edit-parameter">
                  <label className='edit-parameter-label-name'>Name: </label>
                  <label className='edit-parameter-label-required'>Required:</label>
                  <label className='edit-parameter-label-type'>Type:</label>
                  <label className='edit-parameter-label-description'>Description:</label>
                </div>
                {editedParameters.map((parameter, index) => (
                  <div key={index} className="edit-parameter-container">
                    <div className="edit-parameter">
                      <input type="text" value={parameter.name} onChange={(e) => handleParameterChange(index, 'name', e.target.value)} />
                      <input type="checkbox" checked={parameter.required} onChange={(e) => handleParameterChange(index, 'required', e.target.checked)} />
                      <select value={parameter.type} onChange={(e) => handleParameterChange(index, 'type', e.target.value)}>
                        <option value="">Select type</option>
                        {parameterTypes.map(type => (<option key={type.id} value={type.type}>{type.type}</option>))}
                      </select>
                      <textarea type="text" value={parameter.description} onChange={(e) => handleParameterChange(index, 'description', e.target.value)} />
                      <button type="button" onClick={() => handleRemoveParameter(index)}>&times;</button>
                    </div>
                  </div>
                ))}
                <button className='parameters-save-button' onClick={saveChanges}>Save changes</button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}






function AddEndpointModal({ onClose, onAdd }) {
  const [uri, setUri] = useState('');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState([{ name: '', required: false, type: '', description: '' }]);
  const [parameterTypes, setParameterTypes] = useState([]);

  useEffect(() => {
    const fetchParameterTypes = async () => {
      try {
        const response = await fetch('/api/parameter-types');
        const data = await response.json();
        setParameterTypes(data);
      } catch (error) {
        console.error('Error fetching parameter types:', error);
      }
    };

    fetchParameterTypes();
  }, []);

  const handleUriChange = (e) => setUri(e.target.value);
  const handleDescriptionChange = (e) => setDescription(e.target.value);
  const handleParameterChange = (index, field, value) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);
  };

  const handleAddParameter = () => {
    setParameters([...parameters, { name: '', required: false, type: '', description: '' }]);
  };

  const handleRemoveParameter = (index) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newEndpoint = {
      uri,
      description,
      parameters
    };
    onAdd(newEndpoint);
  };

  return (
    <div className="modal">
      <div className="modal-content-endpoint">
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Add New Endpoint</h2>
        <form onSubmit={handleSubmit}>
          <label>
            <div class="textarea-container-uri">  
            URI:
            <input type="text" value={uri} onChange={handleUriChange} required />
            </div>
          </label>
          <label>
            <div class="textarea-container-description">
            Description:
            <textarea value={description} onChange={handleDescriptionChange} required />
            </div>
          </label>
          <h3>Parameters</h3>
          <button type="button" onClick={handleAddParameter} className="add-param-button">Add parameter</button>
          {parameters.map((parameter, index) => (
            <div key={index} className="parameter">
              <input
                type="text"
                placeholder="Name"
                value={parameter.name}
                onChange={(e) => handleParameterChange(index, 'name', e.target.value)}
                required
              />
              <input
                type="checkbox"
                checked={parameter.required}
                onChange={(e) => handleParameterChange(index, 'required', e.target.checked)}
              /> Required
              <select
                type="select"
                value={parameter.type}
                onChange={(e) => handleParameterChange(index, 'type', e.target.value)}
                required
              >
                <option value="" disabled>Select type</option>
                {parameterTypes.map((type, i) => (
                  <option key={i} value={type.type}>{type.type}</option>
                ))}
              </select>
              <textarea
                type="text"
                placeholder="Description"
                value={parameter.description}
                onChange={(e) => handleParameterChange(index, 'description', e.target.value)}
                required
              />
              <button type="button" onClick={() => handleRemoveParameter(index)} className="remove-param-button">&times;</button>
              </div>
            ))}
            <button type="submit" className='add-endpoint-button-form'>Add Endpoint</button>
          </form>
        </div>
      </div>
  );
}

export default ServiceInfoPage;
