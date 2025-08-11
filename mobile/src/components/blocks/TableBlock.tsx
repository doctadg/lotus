import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'

interface TableBlockProps {
  data: any // Table markdown node data
}

export const TableBlock: React.FC<TableBlockProps> = ({ data }) => {
  // Simple table rendering for mobile
  // In a full implementation, you would parse the markdown table structure
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Table</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.tableContainer}>
          {/* Placeholder for table content */}
          <Text style={styles.placeholderText}>
            Table content would be rendered here based on the markdown structure
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginVertical: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef'
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef'
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057'
  },
  tableContainer: {
    padding: 16,
    minWidth: '100%'
  },
  placeholderText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic'
  }
})