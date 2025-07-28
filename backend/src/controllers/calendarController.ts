import { Request, Response } from 'express';
import { GoogleOAuthService } from '../services/googleOAuthService';
import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { AuthRequest } from '../middleware/auth';

export const getCalendarEvents = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const googleOAuthService = GoogleOAuthService.getInstance();
    const calendar = googleOAuthService.getCalendarClient(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    const { timeMin, timeMax, maxResults = 10 } = req.query;

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin as string || new Date().toISOString(),
      timeMax: timeMax as string || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: parseInt(maxResults as string),
      singleEvents: true,
      orderBy: 'startTime'
    });

    res.json({
      events: response.data.items || [],
      nextPageToken: response.data.nextPageToken
    });
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
};

export const createCalendarEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { summary, description, start, end, attendees } = req.body;

    if (!summary || !start || !end) {
      return res.status(400).json({ error: 'Summary, start, and end are required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const googleOAuthService = GoogleOAuthService.getInstance();
    const calendar = googleOAuthService.getCalendarClient(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      },
      attendees: attendees || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
};

export const updateCalendarEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { eventId } = req.params;
    const { summary, description, start, end, attendees } = req.body;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const googleOAuthService = GoogleOAuthService.getInstance();
    const calendar = googleOAuthService.getCalendarClient(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: 'UTC'
      },
      end: {
        dateTime: end,
        timeZone: 'UTC'
      },
      attendees: attendees || []
    };

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({ error: 'Failed to update calendar event' });
  }
};

export const deleteCalendarEvent = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { eventId } = req.params;

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const googleOAuthService = GoogleOAuthService.getInstance();
    const calendar = googleOAuthService.getCalendarClient(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    await calendar.events.delete({
      calendarId: 'primary',
      eventId
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
};

export const getCalendarList = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user || !user.googleAccessToken) {
      return res.status(400).json({ error: 'Google account not connected' });
    }

    const googleOAuthService = GoogleOAuthService.getInstance();
    const calendar = googleOAuthService.getCalendarClient(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    const response = await calendar.calendarList.list();

    res.json({
      calendars: response.data.items || []
    });
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    res.status(500).json({ error: 'Failed to fetch calendar list' });
  }
};

export const checkCalendarConnection = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.id } });

    if (!user || !user.googleAccessToken) {
      return res.json({ connected: false, message: 'Google account not connected' });
    }

    const googleOAuthService = GoogleOAuthService.getInstance();
    const calendar = googleOAuthService.getCalendarClient(
      user.googleAccessToken,
      user.googleRefreshToken
    );

    // Test the connection by trying to list calendars
    await calendar.calendarList.list();

    res.json({ 
      connected: true, 
      message: 'Google Calendar connected successfully',
      lastSync: user.updatedAt
    });
  } catch (error) {
    console.error('Error checking calendar connection:', error);
    res.json({ 
      connected: false, 
      message: 'Google Calendar connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}; 