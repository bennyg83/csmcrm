import React, { useState, useEffect, useMemo } from 'react';
import {
  Autocomplete,
  TextField,
  Chip,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import { User, Contact } from '../types';
import { apiService } from '../services/api';

interface UserAutocompleteProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  context?: 'internal' | 'external';
  accountId?: string;
  accountContacts?: Contact[];
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
}

interface Option {
  id: string;
  name: string;
  email: string;
  type: 'user' | 'contact';
  displayName: string;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  label,
  value,
  onChange,
  context = 'global',
  accountId,
  accountContacts = [],
  disabled = false,
  error = false,
  helperText
}) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Memoize the selected options to prevent unnecessary re-renders
  const selectedOptions = useMemo(() => {
    return options.filter(option => value.includes(option.id));
  }, [options, value]);

  useEffect(() => {
    const loadOptions = async () => {
      setLoading(true);
      try {
        const options: Option[] = [];

        if (context === 'internal') {
          // Only load internal users
          try {
            const users = await apiService.getAllUsers();
            users.forEach(user => {
              options.push({
                id: user.id,
                name: user.name,
                email: user.email,
                type: 'user' as const,
                displayName: `${user.name} (${user.email}) - Internal`
              });
            });
          } catch (error) {
            console.warn('Failed to load users, using fallback data:', error);
            // Fallback users for development/testing
            options.push(
              {
                id: 'admin-1',
                name: 'Admin User',
                email: 'admin@crm.com',
                type: 'user' as const,
                displayName: 'Admin User (admin@crm.com) - Internal'
              },
              {
                id: 'user-1',
                name: 'Regular User',
                email: 'user@crm.com',
                type: 'user' as const,
                displayName: 'Regular User (user@crm.com) - Internal'
              }
            );
          }
        } else if (context === 'external') {
          // Only load contacts
          if (accountContacts && accountContacts.length > 0) {
            // Only show contacts from this account
            accountContacts.forEach(contact => {
              options.push({
                id: contact.id,
                name: `${contact.firstName} ${contact.lastName}`,
                email: contact.email,
                type: 'contact' as const,
                displayName: `${contact.firstName} ${contact.lastName} (${contact.email}) - ${contact.title || 'Contact'}`
              });
            });
          } else {
            // Load all contacts from all accounts (for sidebar/global context)
            try {
              const accounts = await apiService.getAccounts();
              for (const account of accounts) {
                if (account.contacts) {
                  account.contacts.forEach(contact => {
                    options.push({
                      id: contact.id,
                      name: `${contact.firstName} ${contact.lastName}`,
                      email: contact.email,
                      type: 'contact' as const,
                      displayName: `${contact.firstName} ${contact.lastName} (${contact.email}) - ${account.name}`
                    });
                  });
                }
              }
            } catch (error) {
              console.warn('Failed to load accounts for contacts:', error);
            }
          }
        }

        setOptions(options);
      } catch (error) {
        console.error('Failed to load users:', error);
        // Set some basic fallback options
        const fallbackOptions = [
          {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@crm.com',
            type: 'user' as const,
            displayName: 'Admin User (admin@crm.com) - Internal'
          }
        ];
        setOptions(fallbackOptions);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [context, accountId, accountContacts]);

  const handleChange = (event: any, newValue: Option[]) => {
    const newIds = newValue.map(option => option.id);
    onChange(newIds);
  };

  return (
    <Autocomplete
      multiple
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      getOptionLabel={(option) => option.displayName}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      loading={loading}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderTags={(value, getTagProps) =>
        value.map((option, index) => {
          const { key, ...tagProps } = getTagProps({ index });
          return (
            <Chip
              key={key}
              label={option.name}
              {...tagProps}
              color={option.type === 'user' ? 'primary' : 'secondary'}
              variant="outlined"
            />
          );
        })
      }
      renderOption={(props, option) => {
        const { key, ...otherProps } = props;
        return (
          <Box component="li" key={key} {...otherProps}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {option.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {option.type === 'user' ? option.email : 'Client Contact'}
              </Typography>
            </Box>
          </Box>
        );
      }}
      filterOptions={(options, { inputValue }) => {
        const filtered = options.filter(option =>
          option.displayName.toLowerCase().includes(inputValue.toLowerCase()) ||
          option.email.toLowerCase().includes(inputValue.toLowerCase())
        );
        return filtered;
      }}
    />
  );
};

export default UserAutocomplete; 