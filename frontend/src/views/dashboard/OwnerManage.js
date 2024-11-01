import React from 'react';
import {
  CAvatar,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPeople } from '@coreui/icons';

import avatar1 from 'src/assets/images/avatars/1.jpg';
import avatar2 from 'src/assets/images/avatars/2.jpg';
import avatar3 from 'src/assets/images/avatars/3.jpg';
import avatar4 from 'src/assets/images/avatars/4.jpg';
import avatar5 from 'src/assets/images/avatars/5.jpg';
import avatar6 from 'src/assets/images/avatars/6.jpg';

// Example data for each table
const tableData1 = [
  {
    avatar: { src: avatar1, status: 'success' },
    user: { name: 'Yiorgos Avraamu', new: true, registered: 'Jan 1, 2023' },
    country: { name: 'USA' },
    usage: { value: 50, period: 'Jun 11, 2023 - Jul 10, 2023', color: 'success' },
    payment: { name: 'Mastercard' },
    activity: '10 sec ago',
  },
  {
    avatar: { src: avatar2, status: 'danger' },
    user: { name: 'Avram Tarasios', new: false, registered: 'Jan 1, 2023' },
    country: { name: 'Brazil' },
    usage: { value: 22, period: 'Jun 11, 2023 - Jul 10, 2023', color: 'info' },
    payment: { name: 'Visa' },
    activity: '5 minutes ago',
  },
  // More entries...
];

const tableData2 = [
  {
    avatar: { src: avatar3, status: 'warning' },
    user: { name: 'Quintin Ed', new: true, registered: 'Jan 1, 2023' },
    country: { name: 'India' },
    usage: { value: 74, period: 'Jun 11, 2023 - Jul 10, 2023', color: 'warning' },
    payment: { name: 'Stripe' },
    activity: '1 hour ago',
  },
  {
    avatar: { src: avatar4, status: 'secondary' },
    user: { name: 'Enéas Kwadwo', new: true, registered: 'Jan 1, 2023' },
    country: { name: 'France' },
    usage: { value: 98, period: 'Jun 11, 2023 - Jul 10, 2023', color: 'danger' },
    payment: { name: 'PayPal' },
    activity: 'Last month',
  },
  // More entries...
];

const tableData3 = [
  {
    avatar: { src: avatar5, status: 'success' },
    user: { name: 'Agapetus Tadeáš', new: true, registered: 'Jan 1, 2023' },
    country: { name: 'Spain' },
    usage: { value: 22, period: 'Jun 11, 2023 - Jul 10, 2023', color: 'primary' },
    payment: { name: 'Google Wallet' },
    activity: 'Last week',
  },
  {
    avatar: { src: avatar6, status: 'danger' },
    user: { name: 'Friderik Dávid', new: true, registered: 'Jan 1, 2023' },
    country: { name: 'Poland' },
    usage: { value: 43, period: 'Jun 11, 2023 - Jul 10, 2023', color: 'success' },
    payment: { name: 'Amex' },
    activity: 'Last week',
  },
  // More entries...
];

const renderTable = (data, title) => (
  <CCol xs>
    <CCard className="mb-4">
      <CCardHeader>{title}</CCardHeader>
      <CCardBody>
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell className="bg-body-tertiary text-center">
                <CIcon icon={cilPeople} />
              </CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">User</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary text-center">Country</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">Usage</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary text-center">Payment Method</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">Activity</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {data.map((item, index) => (
              <CTableRow key={index}>
                <CTableDataCell className="text-center">
                  <CAvatar size="md" src={item.avatar.src} status={item.avatar.status} />
                </CTableDataCell>
                <CTableDataCell>
                  <div>{item.user.name}</div>
                  <div className="small text-body-secondary text-nowrap">
                    <span>{item.user.new ? 'New' : 'Recurring'}</span> | Registered: {item.user.registered}
                  </div>
                </CTableDataCell>
                <CTableDataCell className="text-center">{item.country.name}</CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex justify-content-between text-nowrap">
                    <div className="fw-semibold">{item.usage.value}%</div>
                    <div className="ms-3">
                      <small className="text-body-secondary">{item.usage.period}</small>
                    </div>
                  </div>
                </CTableDataCell>
                <CTableDataCell className="text-center">{item.payment.name}</CTableDataCell>
                <CTableDataCell>
                  <div className="small text-body-secondary text-nowrap">Last login</div>
                  <div className="fw-semibold text-nowrap">{item.activity}</div>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  </CCol>
);

const Dashboard = () => (
  <CRow>
    {renderTable(tableData1, 'My Instances')}
    {renderTable(tableData2, 'My Instance Types')}
    {renderTable(tableData3, 'My Price Tiers')}
  </CRow>
);

export default Dashboard;
