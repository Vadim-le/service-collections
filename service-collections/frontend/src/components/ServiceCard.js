import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './styles/ServiceCard.css'; // Import the CSS file

function ServiceCard() {
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newService, setNewService] = useState({
    name: '',
    category_id: '',
    image: '',
    uri: '',
    description: ''
  });
  const [imagePreview, setImagePreview] = useState('add_img.png'); // Pre-set image URL

  const fetchData = async () => {
    try {
      const response = await fetch('/api/service');
      const data = await response.json();
      console.log('Received data:', data);
      setServices(data);
      setFilteredServices(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = services.filter(service =>
      service.name && service.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredByCategory = selectedCategory
      ? filtered.filter(service => service.category_name === selectedCategory)
      : filtered;

    setFilteredServices(filteredByCategory);
  }, [searchTerm, services, selectedCategory]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = event => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = event => {
    setSelectedCategory(event.target.value);
  };

  const handleNewServiceChange = event => {
    const { name, value } = event.target;
    setNewService(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = event => {
    const file = event.target.files[0];
    setNewService(prevState => ({
      ...prevState,
      image: file
    }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleNewServiceSubmit = async event => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('name', newService.name);
    formData.append('categoryId', newService.category_id);
    formData.append('image', newService.image);
    formData.append('uri', newService.uri);
    formData.append('description', newService.description);
  
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        body: formData
      });
  
      if (response.ok) {
        await fetchData(); // Fetch data from the server after successfully adding the new service
        setShowForm(false);
        setNewService({
          name: '',
          category_id: '',
          image: '',
          uri: '',
          description: ''
        });
        setImagePreview('add_img.png');
      } else if (response.status === 409) {
        // Conflict error
        const errorData = await response.json();
        console.error('Error adding new service:', errorData.error);
        alert(`Error: ${errorData.error}`); // Display error message to the user
      } else {
        console.error('Error adding new service:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding new service:', error);
    }
  };
  

  const getUniqueCategories = () => {
    const uniqueCategories = new Set();
    services.forEach(service => {
      uniqueCategories.add(service.category_name);
    });
    return Array.from(uniqueCategories);
  };

  return (
    <div>
      <div className="search-container">
      <button className="add-service-button" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Отменить' : 'Добавить сервис'}
      </button>
        <div className="option-container">
          <select value={selectedCategory} onChange={handleCategoryChange}>
            <option value="">Все категории</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <input
          type="text"
          placeholder="Поиск..."
          value={searchTerm}
          onChange={handleChange}
        />
      </div>



      {showForm && (
        <form className="service-form" onSubmit={handleNewServiceSubmit}>
          <div className="file-upload-container">
            <img
              src={imagePreview}
              alt="Preview"
              className="image-preview"
              onClick={() => document.getElementById('file-upload').click()}
            />
            <input
              id="file-upload"
              type="file"
              name="image"
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
          </div>
          <input
            type="text"
            name="name"
            placeholder="Название"
            value={newService.name}
            onChange={handleNewServiceChange}
            required
          />
          <textarea
            name="description"
            placeholder="Описание"
            value={newService.description}
            onChange={handleNewServiceChange}
            required
          />
          <select
            className='category_id'
            name="category_id"
            value={newService.category_id}
            onChange={event => {
              const selectedCategory = categories.find(category => category.id === parseInt(event.target.value));
              if (selectedCategory) {
                setNewService(prevState => ({
                  ...prevState,
                  category_id: selectedCategory.id,
                  category_name: selectedCategory.name
                }));
              }
            }}
            required
          >
            <option value="">Выберите категорию</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            name="uri"
            placeholder="URL-адрес API"
            value={newService.uri}
            onChange={handleNewServiceChange}
            required
          />
          <button type="submit">Добавить</button>
        </form>
      )}

      <div className="service-card-container">
        {filteredServices.map(service => (
          <Link key={service.id} to={`/services/${service.name}`} className="service-card-item">
            <div>
              <img src={service.image} alt={service.name} />
              <h1 className="custom-h1">{service.name}</h1>
              <h2 className="custom-h2">*{service.api_source}</h2>
              <h3>{service.description}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ServiceCard;
