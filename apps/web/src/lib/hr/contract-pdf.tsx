import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.6,
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#333',
  },
  sectionContent: {
    fontSize: 11,
    color: '#444',
    lineHeight: 1.6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 140,
    fontWeight: 'bold',
    fontFamily: 'Helvetica-Bold',
    color: '#555',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  signatureSection: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
  },
  signatureImage: {
    width: 200,
    height: 80,
    marginBottom: 8,
  },
  signatureLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
});

interface ContractSection {
  title: string;
  content: string;
}

interface ContractPdfProps {
  title: string;
  type: string;
  employee: {
    first_name: string;
    last_name: string;
    email?: string;
    job_title?: string;
  };
  content: ContractSection[];
  signature?: {
    signature_data: string;
    signature_method: string;
    typed_name?: string;
    signed_at: string;
    ip_address?: string;
  } | null;
  createdAt?: string;
}

export function ContractPdfDocument({
  title,
  type,
  employee,
  content,
  signature,
  createdAt,
}: ContractPdfProps) {
  const typeLabels: Record<string, string> = {
    employment: 'Employment Contract',
    nda: 'Non-Disclosure Agreement',
    amendment: 'Contract Amendment',
    other: 'Contract',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{typeLabels[type] ?? type}</Text>
          {createdAt && (
            <Text style={styles.subtitle}>
              Date: {new Date(createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Employee Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {employee.first_name} {employee.last_name}
            </Text>
          </View>
          {employee.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{employee.email}</Text>
            </View>
          )}
          {employee.job_title && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{employee.job_title}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Content Sections */}
        {Array.isArray(content) && content.map((section: ContractSection, index: number) => (
          <View key={index} style={styles.section}>
            {section.title && (
              <Text style={styles.sectionTitle}>{section.title}</Text>
            )}
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Signature */}
        {signature && (
          <View style={styles.signatureSection}>
            <Text style={styles.sectionTitle}>Signature</Text>
            {signature.signature_data && (
              <Image
                style={styles.signatureImage}
                src={signature.signature_data}
              />
            )}
            {signature.typed_name && (
              <Text style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 4 }}>
                {signature.typed_name}
              </Text>
            )}
            <Text style={styles.signatureLabel}>
              Signed on: {new Date(signature.signed_at).toLocaleString()}
            </Text>
            <Text style={styles.signatureLabel}>
              Method: {signature.signature_method === 'draw' ? 'Hand-drawn' : 'Typed'}
            </Text>
            {signature.ip_address && (
              <Text style={styles.signatureLabel}>
                IP: {signature.ip_address}
              </Text>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by CCD Suite
        </Text>
      </Page>
    </Document>
  );
}
