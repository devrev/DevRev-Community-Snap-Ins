import axios, { AxiosInstance } from 'axios';

interface BookingPayload {
  [key: string]: any;
}

interface ReschedulePayload {
  [key: string]: any;
}

interface BookingResponse {
  [key: string]: any;
}

interface EventTypeResponse {
  [key: string]: any;
}

interface UserScheduleResponse {
  [key: string]: any;
}

interface SlotResponse {
  [key: string]: any;
}

const api = (api_key: string): AxiosInstance => {
  return axios.create({
    baseURL: 'https://api.cal.com/v2',
    headers: {
      Authorization: `Bearer ${api_key}`,
      'Content-Type': 'application/json',
      'cal-api-version': '2024-08-13',
    },
  });
};

const CalComService = (apiKey: string) => {
  const apiClient = api(apiKey || 'cal_live_062aaa1387059dd9e1117a64477c9d37');

  return {
    async bookMeeting(eventTypeId: string, payload: BookingPayload): Promise<BookingResponse> {
      const response = await apiClient.post(`/event-types/${eventTypeId}/book`, payload);
      return response.data;
    },

    async cancelBooking(bookingId: string): Promise<void> {
      await apiClient.delete(`/bookings/${bookingId}`);
    },

    async createBooking(payload: BookingPayload): Promise<BookingResponse> {
      const response = await apiClient.post('/bookings', payload);
      return response.data;
    },

    async getEventTypes(username: string): Promise<EventTypeResponse> {
      const response = await apiClient.get(`/event-types?username=${username}`);
      console.log('event:', JSON.stringify(response.data.error));
      return response.data;
    },

    async getMe(): Promise<any> {
      const response = await apiClient.get('/me');
      return response.data;
    },

    async getSlots(eventTypeId: string, queryParams: Record<string, any> = {}): Promise<SlotResponse> {
      const response = await apiClient.get(`/event-types/${eventTypeId}/slots`, { params: queryParams });
      return response.data;
    },

    async getUserSchedule(userId: string): Promise<UserScheduleResponse> {
      const response = await apiClient.get(`/users/${userId}/schedule`);
      return response.data;
    },

    async rescheduleBooking(bookingId: string, payload: ReschedulePayload): Promise<BookingResponse> {
      const response = await apiClient.patch(`/bookings/${bookingId}`, payload);
      return response.data;
    },
  };
};

export default CalComService;
