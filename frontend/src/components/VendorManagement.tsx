import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  is_active: boolean;
}

interface VendorCategoryMap {
  id: string;
  vendor_name: string;
  vendor_email: string;
  category: string;
  confidence_score: number;
  is_auto_mapped: boolean;
}

interface VendorManagementProps {
  vendors: Vendor[];
  categoryMaps: VendorCategoryMap[];
  onAddVendor: (vendor: Omit<Vendor, 'id'>) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendorId: string) => void;
  onUpdateCategoryMap: (map: VendorCategoryMap) => void;
}

const VendorManagement: React.FC<VendorManagementProps> = ({
  vendors,
  categoryMaps,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onUpdateCategoryMap,
}) => {
  const [showVendorDialog, setShowVendorDialog] = useState(false);
  const [showCategoryMapDialog, setShowCategoryMapDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [selectedMap, setSelectedMap] = useState<VendorCategoryMap | null>(null);
  const [newVendor, setNewVendor] = useState<Omit<Vendor, 'id'>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: '',
    is_active: true,
  });

  const handleAddVendor = () => {
    onAddVendor(newVendor);
    setShowVendorDialog(false);
    setNewVendor({
      name: '',
      email: '',
      phone: '',
      address: '',
      category: '',
      is_active: true,
    });
  };

  const handleUpdateVendor = () => {
    if (selectedVendor) {
      onUpdateVendor(selectedVendor);
      setShowVendorDialog(false);
      setSelectedVendor(null);
    }
  };

  const handleUpdateCategoryMap = () => {
    if (selectedMap) {
      onUpdateCategoryMap(selectedMap);
      setShowCategoryMapDialog(false);
      setSelectedMap(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      lab: 'primary',
      supplies: 'secondary',
      software: 'info',
      rent: 'warning',
      utilities: 'error',
      payroll: 'success',
      insurance: 'info',
      marketing: 'warning',
      maintenance: 'error',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5">Vendor Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowVendorDialog(true)}
        >
          Add Vendor
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Vendors
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>{vendor.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.category}
                          color={getCategoryColor(vendor.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.is_active ? 'Active' : 'Inactive'}
                          color={vendor.is_active ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedVendor(vendor);
                              setShowVendorDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => onDeleteVendor(vendor.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Category Mappings</Typography>
              <Button
                variant="outlined"
                startIcon={<CategoryIcon />}
                onClick={() => setShowCategoryMapDialog(true)}
              >
                Manage Mappings
              </Button>
            </Box>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Confidence</TableCell>
                    <TableCell>Auto-mapped</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryMaps.map((map) => (
                    <TableRow key={map.id}>
                      <TableCell>{map.vendor_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={map.category}
                          color={getCategoryColor(map.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${(map.confidence_score * 100).toFixed(0)}%`}
                          color={
                            map.confidence_score > 0.8
                              ? 'success'
                              : map.confidence_score > 0.5
                              ? 'warning'
                              : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={map.is_auto_mapped ? 'Yes' : 'No'}
                          color={map.is_auto_mapped ? 'info' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Vendor Dialog */}
      <Dialog open={showVendorDialog} onClose={() => setShowVendorDialog(false)}>
        <DialogTitle>
          {selectedVendor ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={selectedVendor?.name || newVendor.name}
              onChange={(e) =>
                selectedVendor
                  ? setSelectedVendor({ ...selectedVendor, name: e.target.value })
                  : setNewVendor({ ...newVendor, name: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Email"
              value={selectedVendor?.email || newVendor.email}
              onChange={(e) =>
                selectedVendor
                  ? setSelectedVendor({ ...selectedVendor, email: e.target.value })
                  : setNewVendor({ ...newVendor, email: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Phone"
              value={selectedVendor?.phone || newVendor.phone}
              onChange={(e) =>
                selectedVendor
                  ? setSelectedVendor({ ...selectedVendor, phone: e.target.value })
                  : setNewVendor({ ...newVendor, phone: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Address"
              value={selectedVendor?.address || newVendor.address}
              onChange={(e) =>
                selectedVendor
                  ? setSelectedVendor({ ...selectedVendor, address: e.target.value })
                  : setNewVendor({ ...newVendor, address: e.target.value })
              }
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedVendor?.category || newVendor.category}
                label="Category"
                onChange={(e) =>
                  selectedVendor
                    ? setSelectedVendor({ ...selectedVendor, category: e.target.value })
                    : setNewVendor({ ...newVendor, category: e.target.value })
                }
              >
                <MenuItem value="lab">Lab</MenuItem>
                <MenuItem value="supplies">Supplies</MenuItem>
                <MenuItem value="software">Software</MenuItem>
                <MenuItem value="rent">Rent</MenuItem>
                <MenuItem value="utilities">Utilities</MenuItem>
                <MenuItem value="payroll">Payroll</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedVendor?.is_active ?? newVendor.is_active}
                  onChange={(e) =>
                    selectedVendor
                      ? setSelectedVendor({ ...selectedVendor, is_active: e.target.checked })
                      : setNewVendor({ ...newVendor, is_active: e.target.checked })
                  }
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowVendorDialog(false)}>Cancel</Button>
          <Button
            onClick={selectedVendor ? handleUpdateVendor : handleAddVendor}
            variant="contained"
          >
            {selectedVendor ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Category Map Dialog */}
      <Dialog
        open={showCategoryMapDialog}
        onClose={() => setShowCategoryMapDialog(false)}
      >
        <DialogTitle>Manage Category Mappings</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Vendor</InputLabel>
              <Select
                value={selectedMap?.vendor_name || ''}
                label="Vendor"
                onChange={(e) => {
                  const vendor = vendors.find((v) => v.name === e.target.value);
                  if (vendor) {
                    setSelectedMap({
                      id: '',
                      vendor_name: vendor.name,
                      vendor_email: vendor.email,
                      category: vendor.category,
                      confidence_score: 1.0,
                      is_auto_mapped: false,
                    });
                  }
                }}
              >
                {vendors.map((vendor) => (
                  <MenuItem key={vendor.id} value={vendor.name}>
                    {vendor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedMap?.category || ''}
                label="Category"
                onChange={(e) =>
                  selectedMap &&
                  setSelectedMap({ ...selectedMap, category: e.target.value })
                }
              >
                <MenuItem value="lab">Lab</MenuItem>
                <MenuItem value="supplies">Supplies</MenuItem>
                <MenuItem value="software">Software</MenuItem>
                <MenuItem value="rent">Rent</MenuItem>
                <MenuItem value="utilities">Utilities</MenuItem>
                <MenuItem value="payroll">Payroll</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="marketing">Marketing</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={selectedMap?.is_auto_mapped || false}
                  onChange={(e) =>
                    selectedMap &&
                    setSelectedMap({ ...selectedMap, is_auto_mapped: e.target.checked })
                  }
                />
              }
              label="Auto-map"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCategoryMapDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateCategoryMap} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorManagement; 