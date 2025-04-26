import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    padding: 10,
    borderTop: '1pt solid #999',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    width: 100,
  },
  value: {
    fontSize: 10,
    flex: 1,
  },
  signature: {
    marginTop: 10,
    width: 200,
    height: 100,
    objectFit: 'contain',
  },
  disclaimer: {
    fontSize: 8,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  ipAddress: {
    fontSize: 6,
    color: '#999',
    marginTop: 5,
  },
});

interface ConsentSectionProps {
  signed_by: string;
  signed_at: string;
  signature_data: string;
  ip_address: string;
}

export const ConsentSection: React.FC<ConsentSectionProps> = ({
  signed_by,
  signed_at,
  signature_data,
  ip_address,
}) => {
  const formattedDate = format(new Date(signed_at), 'PPpp');

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Treatment Plan Consent</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Signed By:</Text>
        <Text style={styles.value}>{signed_by}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.value}>{formattedDate}</Text>
      </View>

      <Image
        style={styles.signature}
        src={signature_data}
      />

      <Text style={styles.disclaimer}>
        This treatment plan has been electronically signed and is legally binding.
        The signature above was captured in compliance with HIPAA guidelines and
        state regulations regarding electronic signatures in healthcare.
      </Text>

      <Text style={styles.ipAddress}>
        Verification ID: {ip_address} • {formattedDate}
      </Text>
    </View>
  );
}; 