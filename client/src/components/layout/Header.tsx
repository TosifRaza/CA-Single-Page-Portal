import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Menu,
  Check,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import { NotificationItem } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification state
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Fetch notifications
  const loadNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.data) {
        setNotifications(res.data.data.notifications || []);
        setUnreadCount(res.data.data.unreadCount ?? 0);
      }
    } catch (e) {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Handle Search Debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(res.data?.data);
        setSearchOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-light-card dark:bg-dark-sidebar border-b border-light-border dark:border-dark-border transition-colors">
      {/* Left: Mobile Menu & Search Bar */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-xl">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 rounded-lg text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-card lg:hidden"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Input */}
        <div ref={searchRef} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-light-textMuted dark:text-dark-textMuted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setSearchOpen(true);
              }}
              placeholder="Search anything... (Clients, Tax, Works...)"
              className="w-full pl-10 pr-4 py-2 text-[15px] bg-light-bg dark:bg-dark-bg border border-light-border/80 dark:border-dark-border rounded-xl text-light-textPrimary dark:text-dark-textPrimary placeholder:text-light-textMuted dark:placeholder:text-dark-textMuted focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all"
            />
          </div>

          {/* Search Results Dropdown */}
          {searchOpen && searchResults && (
            <div className="absolute top-12 left-0 right-0 p-3 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-xl z-50 max-h-[420px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
              {searchResults.clients?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[13px] font-bold uppercase tracking-wider text-light-textMuted dark:text-dark-textMuted mb-1 px-2">
                    Clients
                  </div>
                  {searchResults.clients.map((c: any) => (
                    <div
                      key={c._id}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/clients/${c._id}`);
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary cursor-pointer text-xs"
                    >
                      <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                        {c.businessName || c.name}
                      </span>
                      <span className="text-[13px] text-brand-500 font-medium">{c.pan}</span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.works?.length > 0 && (
                <div className="mb-3">
                  <div className="text-[13px] font-bold uppercase tracking-wider text-light-textMuted dark:text-dark-textMuted mb-1 px-2">
                    Work Assignments
                  </div>
                  {searchResults.works.map((w: any) => (
                    <div
                      key={w._id}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/works`);
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary cursor-pointer text-xs"
                    >
                      <span className="font-medium text-light-textPrimary dark:text-dark-textPrimary">
                        {w.workCode} — {w.workMasterId?.workName}
                      </span>
                      <span className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary">
                        {w.clientId?.businessName || w.clientId?.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {searchResults.taxes?.length > 0 && (
                <div>
                  <div className="text-[13px] font-bold uppercase tracking-wider text-light-textMuted dark:text-dark-textMuted mb-1 px-2">
                    Tax Master
                  </div>
                  {searchResults.taxes.map((t: any) => (
                    <div
                      key={t._id}
                      onClick={() => {
                        setSearchOpen(false);
                        navigate(`/masters/tax`);
                      }}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-light-bg dark:hover:bg-dark-cardSecondary cursor-pointer text-xs"
                    >
                      <span className="font-semibold text-light-textPrimary dark:text-dark-textPrimary">
                        {t.taxName} ({t.taxGroup})
                      </span>
                      <span className="text-[13px] text-status-green font-medium">{t.dueDateRule}</span>
                    </div>
                  ))}
                </div>
              )}

              {(!searchResults.clients?.length &&
                !searchResults.works?.length &&
                !searchResults.taxes?.length) && (
                <div className="p-4 text-center text-xs text-light-textSecondary dark:text-dark-textSecondary">
                  No matching results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions: Notifications, Org Selector, Theme Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Bell Dropdown */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-xl text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-card transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[17px] h-[17px] px-1 text-[12px] font-bold text-white bg-status-red rounded-full ring-2 ring-white dark:ring-dark-sidebar">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 p-3 bg-white dark:bg-dark-card border border-light-border dark:border-dark-border rounded-2xl shadow-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-light-border/70 dark:border-dark-border/70">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-light-textPrimary dark:text-dark-textPrimary">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[12px] font-semibold bg-brand-500/10 text-brand-500 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={handleMarkAllRead}
                  className="text-[13px] font-medium text-brand-500 hover:text-brand-600 flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`p-2.5 rounded-xl text-xs transition-colors ${
                        n.isRead
                          ? 'bg-transparent text-light-textSecondary dark:text-dark-textSecondary'
                          : 'bg-light-bg dark:bg-dark-cardSecondary text-light-textPrimary dark:text-dark-textPrimary font-medium border-l-2 border-brand-500'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-0.5">{n.title}</div>
                      <div className="text-[13px] text-light-textSecondary dark:text-dark-textSecondary leading-relaxed">
                        {n.message}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-light-textMuted dark:text-dark-textMuted">
                    No new notifications
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-light-textSecondary dark:text-dark-textSecondary hover:bg-light-bg dark:hover:bg-dark-card hover:text-brand-500 transition-colors"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-indigo-600 transition-transform hover:-rotate-12" />
          ) : (
            <Sun className="w-5 h-5 text-amber-400 transition-transform hover:rotate-45" />
          )}
        </button>
      </div>
    </header>
  );
};
