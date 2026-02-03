import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import { apiService } from '../services/api';
import type { EntityFileWithSource, EntityFileOwnerType } from '../types';

interface EntityFilesProps {
  entityType: EntityFileOwnerType;
  entityId: string;
  /** When true, show "Visible to child entities" on upload (project/account only). */
  showVisibleToChildrenOption?: boolean;
  title?: string;
}

export const EntityFiles: React.FC<EntityFilesProps> = ({
  entityType,
  entityId,
  showVisibleToChildrenOption = false,
  title = 'Files',
}) => {
  const [files, setFiles] = useState<EntityFileWithSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [visibleToChildren, setVisibleToChildren] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    if (!entityId) return;
    setLoading(true);
    setError(null);
    try {
      const list = await apiService.getEntityFiles(entityType, entityId);
      setFiles(list);
    } catch (e) {
      console.error(e);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [entityType, entityId]);

  const handleUploadClick = () => {
    setUploadError(null);
    setVisibleToChildren(false);
    setUploadDialogOpen(true);
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !entityId) return;
    setUploading(true);
    setUploadError(null);
    try {
      await apiService.uploadEntityFile(
        entityType,
        entityId,
        file,
        showVisibleToChildrenOption ? visibleToChildren : undefined
      );
      await loadFiles();
      setUploadDialogOpen(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: string, originalName: string) => {
    try {
      const blob = await apiService.downloadEntityFile(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = originalName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this file?')) return;
    try {
      await apiService.deleteEntityFile(id);
      await loadFiles();
    } catch (err) {
      console.error(err);
    }
  };

  const canDelete = (f: EntityFileWithSource) =>
    f.source === entityType && f.sourceId === entityId;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">{title}</Typography>
          <Button
            size="small"
            startIcon={<AttachFileIcon />}
            variant="outlined"
            onClick={handleUploadClick}
            disabled={!entityId}
          >
            Upload
          </Button>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          hidden
          onChange={handleFileChange}
          disabled={uploading}
        />

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={2}><CircularProgress size={32} /></Box>
        ) : files.length === 0 ? (
          <Typography variant="body2" color="text.secondary">No files. Upload to attach documents.</Typography>
        ) : (
          <List dense disablePadding>
            {files.map((f) => (
              <ListItem
                key={f.id}
                divider
                secondaryAction={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="Download"
                      onClick={() => handleDownload(f.id, f.originalName)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                    {canDelete(f) && (
                      <IconButton
                        size="small"
                        aria-label="Delete"
                        onClick={() => handleDelete(f.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                }
              >
                <ListItemText
                  primary={f.originalName}
                  secondary={
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatSize(f.size)} · {new Date(f.createdAt).toLocaleDateString()}
                      </Typography>
                      {f.source !== entityType || f.sourceId !== entityId ? (
                        <Chip size="small" label={f.sourceName ? `From ${f.source}: ${f.sourceName}` : `From ${f.source}`} variant="outlined" />
                      ) : null}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}

        <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)}>
          <DialogTitle>Upload file</DialogTitle>
          <DialogContent>
            {uploading ? (
              <Box display="flex" alignItems="center" gap={2} py={2}>
                <CircularProgress size={24} />
                <Typography>Uploading…</Typography>
              </Box>
            ) : (
              <>
                {showVisibleToChildrenOption && (
                  <FormControlLabel
                    sx={{ display: 'block', mb: 2 }}
                    control={
                      <Checkbox
                        checked={visibleToChildren}
                        onChange={(e) => setVisibleToChildren(e.target.checked)}
                      />
                    }
                    label="Available to child entities (e.g. tasks under this project)"
                  />
                )}
                <Button variant="outlined" startIcon={<AttachFileIcon />} onClick={triggerFileSelect} fullWidth>
                  Choose file
                </Button>
              </>
            )}
            {uploadError && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setUploadError(null)}>
                {uploadError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};
