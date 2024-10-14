import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
  },
  searchContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    '@media (min-width: 768px)': {
      flexDirection: 'row',
      width: 'auto',
    },
  },
  input: {
    flex: '1',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  select: {
    flex: '1',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    backgroundColor: 'white',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    width: '100%',
    '@media (min-width: 768px)': {
      width: 'auto',
    },
    ':hover': {
      backgroundColor: '#0056b3',
    },
  },
  serviceGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px',
  },
  serviceCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'box-shadow 0.3s',
    ':hover': {
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  },
  serviceImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  serviceContent: {
    padding: '15px',
  },
  serviceName: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  serviceSource: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '10px',
  },
  serviceDescription: {
    fontSize: '14px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    maxWidth: '500px',
    margin: '0 auto',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
  },
  fileUpload: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  imagePreview: {
    width: '150px',
    height: '150px',
    objectFit: 'cover',
    borderRadius: '4px',
    marginBottom: '10px',
    cursor: 'pointer',
  },
};

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
  const [imagePreview, setImagePreview] = useState('add_img.png');

  const fetchData = async () => {
    try {
      const response = await fetch('/api/service');
      const data = await response.json();
      setServices(data);
      setFilteredServices(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCategories();
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

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = event => setSearchTerm(event.target.value);

  const handleCategoryChange = event => setSelectedCategory(event.target.value);

  const handleNewServiceChange = event => {
    const { name, value } = event.target;
    setNewService(prevState => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = event => {
    const file = event.target.files[0];
    setNewService(prevState => ({ ...prevState, image: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleNewServiceSubmit = async event => {
    event.preventDefault();
    const formData = new FormData();
    Object.entries(newService).forEach(([key, value]) => formData.append(key, value));
  
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        body: formData
      });
  
      if (response.ok) {
        await fetchData();
        setShowForm(false);
        setNewService({ name: '', category_id: '', image: '', uri: '', description: '' });
        setImagePreview('add_img.png');
      } else if (response.status === 409) {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      } else {
        console.error('Error adding new service:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding new service:', error);
    }
  };

  const getUniqueCategories = () => [...new Set(services.map(service => service.category_name))];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск..."
            value={searchTerm}
            onChange={handleChange}
            style={styles.input}
          />
          <select value={selectedCategory} onChange={handleCategoryChange} style={styles.select}>
            <option value="">Все категории</option>
            {getUniqueCategories().map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        <button style={styles.button} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Отменить' : 'Добавить сервис'}
        </button>
      </div>

      {showForm && (
        <form style={styles.form} onSubmit={handleNewServiceSubmit}>
          <div style={styles.fileUpload}>
            <img
              src={imagePreview}
              alt="Preview"
              style={styles.imagePreview}
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
            style={styles.input}
          />
          <textarea
            name="description"
            placeholder="Описание"
            value={newService.description}
            onChange={handleNewServiceChange}
            required
            style={{...styles.input, minHeight: '100px'}}
          />
          <select
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
            style={styles.select}
          >
            <option value="">Выберите категорию</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <input
            type="text"
            name="uri"
            placeholder="URL-адрес API"
            value={newService.uri}
            onChange={handleNewServiceChange}
            required
            style={styles.input}
          />
          <button type="submit" style={styles.button}>Добавить</button>
        </form>
      )}

      <div style={styles.serviceGrid}>
        {filteredServices.map(service => (
          <Link key={service.id} to={`/services/${service.name}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={styles.serviceCard}>
              <img src={service.image} alt={service.name} style={styles.serviceImage} />
              <div style={styles.serviceContent}>
                <h2 style={styles.serviceName}>{service.name}</h2>
                <p style={styles.serviceSource}>*{service.api_source}</p>
                <p style={styles.serviceDescription}>{service.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default ServiceCard;