import React, { useState } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormInput,
  CInputGroup,
  CInputGroupText,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import { CIcon } from '@coreui/icons-react'; // Correct import
import { cilPlus } from '@coreui/icons';

const Dashboard = () => {
  const [isInstanceModalOpen, setInstanceModalOpen] = useState(false);
  const [isPriceTierModalOpen, setPriceTierModalOpen] = useState(false);
  const [isInstanceTypeModalOpen, setInstanceTypeModalOpen] = useState(false);

  const [instanceData, setInstanceData] = useState({
    ipAddress: '',
    username: '',
    password: '',
    instanceType: '',
  });
  const [priceTierData, setPriceTierData] = useState({
    priceTier: '',
    pricePerHour: '',
  });
  const [instanceTypeData, setInstanceTypeData] = useState({
    instanceType: '',
    systemType: '',
    cpuCoreCount: '',
    storage: '',
    memory: '',
    priceTierId: '',
  });

  const handleAddInstance = async () => {
    try {
      await fetch('http://localhost:5000/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instanceData),
      });
      alert('Instance added successfully');
      setInstanceModalOpen(false);
    } catch (error) {
      console.error('Error adding instance:', error);
      alert('An error occurred while adding the instance.');
    }
  };

  const handleAddPriceTier = async () => {
    try {
      await fetch('http://localhost:5000/pricetiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(priceTierData),
      });
      alert('Price tier added successfully');
      setPriceTierModalOpen(false);
    } catch (error) {
      console.error('Error adding price tier:', error);
      alert('An error occurred while adding the price tier.');
    }
  };

  const handleAddInstanceType = async () => {
    try {
      await fetch('http://localhost:5000/instancetypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instanceTypeData),
      });
      alert('Instance type added successfully');
      setInstanceTypeModalOpen(false);
    } catch (error) {
      console.error('Error adding instance type:', error);
      alert('An error occurred while adding the instance type.');
    }
  };

  const openInstanceModal = () => setInstanceModalOpen(true);
  const closeInstanceModal = () => setInstanceModalOpen(false);
  const openPriceTierModal = () => setPriceTierModalOpen(true);
  const closePriceTierModal = () => setPriceTierModalOpen(false);
  const openInstanceTypeModal = () => setInstanceTypeModalOpen(true);
  const closeInstanceTypeModal = () => setInstanceTypeModalOpen(false);

  const renderTable = (data, title) => (
    <CCol xs={12}>
      <CCard className="mb-4">
        <CCardHeader>{title}</CCardHeader>
        <CCardBody>
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead className="text-nowrap">
              <CTableRow>
                <CTableHeaderCell>User</CTableHeaderCell>
                <CTableHeaderCell>Country</CTableHeaderCell>
                <CTableHeaderCell>Usage</CTableHeaderCell>
                <CTableHeaderCell>Payment Method</CTableHeaderCell>
                <CTableHeaderCell>Activity</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {data.map((item, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{item.user}</CTableDataCell>
                  <CTableDataCell>{item.country}</CTableDataCell>
                  <CTableDataCell>{item.usage}</CTableDataCell>
                  <CTableDataCell>{item.payment}</CTableDataCell>
                  <CTableDataCell>{item.activity}</CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CCol>
  );

  return (
    <CRow>
      {/* Card with Three Buttons */}
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>Actions</CCardHeader>
          <CCardBody>
            <CRow>
              <CCol xs={12} md={4} className="mb-3">
                <CButton color="primary" className="w-100" onClick={openInstanceModal}>
                  <CIcon icon={cilPlus} /> Add Instance
                </CButton>
              </CCol>
              <CCol xs={12} md={4} className="mb-3">
                <CButton color="info" className="w-100" onClick={openInstanceTypeModal}>
                  <CIcon icon={cilPlus} /> Add Instance Type
                </CButton>
              </CCol>
              <CCol xs={12} md={4} className="mb-3">
                <CButton color="success" className="w-100" onClick={openPriceTierModal}>
                  <CIcon icon={cilPlus} /> Add Price Tier
                </CButton>
              </CCol>
            </CRow>
          </CCardBody>
        </CCard>
      </CCol>

      {/* Tables */}
      {renderTable([], 'My Instances')}
      {renderTable([], 'My Instance Types')}
      {renderTable([], 'My Price Tiers')}

      {/* Instance Modal */}
      <CModal visible={isInstanceModalOpen} onClose={closeInstanceModal}>
        <CModalHeader>
          <CModalTitle>Add New Instance</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CInputGroup className="mb-3">
              <CInputGroupText>IP Address</CInputGroupText>
              <CFormInput
                value={instanceData.ipAddress}
                onChange={(e) =>
                  setInstanceData({ ...instanceData, ipAddress: e.target.value })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Username</CInputGroupText>
              <CFormInput
                value={instanceData.username}
                onChange={(e) =>
                  setInstanceData({ ...instanceData, username: e.target.value })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Password</CInputGroupText>
              <CFormInput
                type="password"
                value={instanceData.password}
                onChange={(e) =>
                  setInstanceData({ ...instanceData, password: e.target.value })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Instance Type</CInputGroupText>
              <CFormInput
                value={instanceData.instanceType}
                onChange={(e) =>
                  setInstanceData({ ...instanceData, instanceType: e.target.value })
                }
              />
            </CInputGroup>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleAddInstance}>
            Add Instance
          </CButton>
          <CButton color="secondary" onClick={closeInstanceModal}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Price Tier Modal */}
      <CModal visible={isPriceTierModalOpen} onClose={closePriceTierModal}>
        <CModalHeader>
          <CModalTitle>Add New Price Tier</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CInputGroup className="mb-3">
              <CInputGroupText>Price Tier</CInputGroupText>
              <CFormInput
                value={priceTierData.priceTier}
                onChange={(e) =>
                  setPriceTierData({ ...priceTierData, priceTier: e.target.value })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Price Per Hour</CInputGroupText>
              <CFormInput
                value={priceTierData.pricePerHour}
                onChange={(e) =>
                  setPriceTierData({ ...priceTierData, pricePerHour: e.target.value })
                }
              />
            </CInputGroup>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="success" onClick={handleAddPriceTier}>
            Add Price Tier
          </CButton>
          <CButton color="secondary" onClick={closePriceTierModal}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Instance Type Modal */}
      <CModal visible={isInstanceTypeModalOpen} onClose={closeInstanceTypeModal}>
        <CModalHeader>
          <CModalTitle>Add New Instance Type</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CInputGroup className="mb-3">
              <CInputGroupText>Instance Type</CInputGroupText>
              <CFormInput
                value={instanceTypeData.instanceType}
                onChange={(e) =>
                  setInstanceTypeData({
                    ...instanceTypeData,
                    instanceType: e.target.value,
                  })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>System Type</CInputGroupText>
              <CFormInput
                value={instanceTypeData.systemType}
                onChange={(e) =>
                  setInstanceTypeData({
                    ...instanceTypeData,
                    systemType: e.target.value,
                  })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>CPU Core Count</CInputGroupText>
              <CFormInput
                value={instanceTypeData.cpuCoreCount}
                onChange={(e) =>
                  setInstanceTypeData({
                    ...instanceTypeData,
                    cpuCoreCount: e.target.value,
                  })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Storage (GB)</CInputGroupText>
              <CFormInput
                value={instanceTypeData.storage}
                onChange={(e) =>
                  setInstanceTypeData({
                    ...instanceTypeData,
                    storage: e.target.value,
                  })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Memory (GB)</CInputGroupText>
              <CFormInput
                value={instanceTypeData.memory}
                onChange={(e) =>
                  setInstanceTypeData({
                    ...instanceTypeData,
                    memory: e.target.value,
                  })
                }
              />
            </CInputGroup>
            <CInputGroup className="mb-3">
              <CInputGroupText>Price Tier ID</CInputGroupText>
              <CFormInput
                value={instanceTypeData.priceTierId}
                onChange={(e) =>
                  setInstanceTypeData({
                    ...instanceTypeData,
                    priceTierId: e.target.value,
                  })
                }
              />
            </CInputGroup>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="info" onClick={handleAddInstanceType}>
            Add Instance Type
          </CButton>
          <CButton color="secondary" onClick={closeInstanceTypeModal}>
            Cancel
          </CButton>
        </CModalFooter>
      </CModal>
    </CRow>
  );
};

export default Dashboard;
