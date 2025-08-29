import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  apiService, 
  GameConfig, 
  PrizeOption, 
  ConfigUpdateRequest, 
  RestaurantData,
  RestaurantConfig,
  Advertisement,
  MenuItem,
  Recommendation
} from '../services/api';
import { wsService } from '../services/websocket';

const AdminContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 30px;
`;

const Header = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 700;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 18px;
  opacity: 0.9;
  margin: 0;
`;

const ConfigForm = styled.div`
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 800px;
`;

const Section = styled.div`
  margin-bottom: 30px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  color: #333;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 16px 0;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  color: #555;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 14px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
  
  &:focus {
    outline: none;
    border-color: #667eea;
  }
  
  &:invalid {
    border-color: #ff6b6b;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => {
    switch (props.$variant) {
      case 'danger':
        return `
          background: #ff6b6b;
          color: white;
          &:hover { background: #ff5252; }
        `;
      case 'secondary':
        return `
          background: #636e72;
          color: white;
          &:hover { background: #2d3436; }
        `;
      default:
        return `
          background: #667eea;
          color: white;
          &:hover { background: #5a67d8; }
        `;
    }
  }}
  
  &:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
  }
`;

const ModeSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
`;

const ModeButton = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? '#667eea' : 'white'};
  color: ${props => props.$active ? 'white' : '#667eea'};
  
  &:hover {
    background: ${props => props.$active ? '#5a67d8' : '#f8f9fa'};
  }
`;

const PrizeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-top: 16px;
`;

const PrizeItem = styled.div`
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 16px;
  background: #f8f9fa;
`;

const PrizeLabel = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
`;

const PrizeInputGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ProbabilityInput = styled(Input)`
  width: 80px;
  flex-shrink: 0;
`;

const ErrorMessage = styled.div`
  background: #ff6b6b;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 16px 0;
  font-weight: 500;
`;

const SuccessMessage = styled.div`
  background: #00b894;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  margin: 16px 0;
  font-weight: 500;
`;

const LoadingMessage = styled.div`
  color: white;
  text-align: center;
  font-size: 18px;
  margin: 40px 0;
`;

const Mode2Display = styled.div`
  background: #f8f9fa;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
`;

const Mode2Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e1e5e9;
  
  &:last-child {
    border-bottom: none;
  }
`;

const Admin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState('lottery1');

  // Default placeholder dishes - same as used in Restaurant display
  const defaultDishes = [
    { name: '宫保鸡丁', price: 28.50 },
    { name: '糖醋排骨', price: 35.00 },
    { name: '麻婆豆腐', price: 22.00 },
    { name: '回锅肉', price: 32.00 },
    { name: '鱼香肉丝', price: 26.00 },
    { name: '水煮牛肉', price: 45.00 },
    { name: '红烧肉', price: 38.00 },
    { name: '清蒸鲈鱼', price: 58.00 },
    { name: '蒜蓉西兰花', price: 18.00 },
    { name: '番茄炒蛋', price: 16.00 },
    { name: '青椒肉丝', price: 24.00 },
    { name: '酸辣土豆丝', price: 14.00 },
    { name: '蚂蚁上树', price: 20.00 },
    { name: '毛血旺', price: 42.00 },
    { name: '香辣虾', price: 48.00 },
    { name: '糖醋里脊', price: 30.00 },
    { name: '葱爆羊肉', price: 55.00 },
    { name: '椒盐排骨', price: 36.00 },
    { name: '地三鲜', price: 22.00 },
    { name: '木须肉', price: 25.00 },
    { name: '口水鸡', price: 28.00 },
    { name: '辣子鸡丁', price: 32.00 },
    { name: '醋溜白菜', price: 15.00 },
    { name: '干煸四季豆', price: 18.00 },
    { name: '西红柿牛腩', price: 38.00 },
    { name: '肉末茄子', price: 20.00 },
    { name: '香菇青菜', price: 16.00 },
    { name: '蒜泥白肉', price: 35.00 },
    { name: '白切鸡', price: 45.00 },
    { name: '干锅花菜', price: 24.00 }
  ];

  // Form state
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [remainingSpins, setRemainingSpins] = useState(100);
  const [selectedMode, setSelectedMode] = useState(1);
  const [mode1Options, setMode1Options] = useState<PrizeOption[]>([]);
  const [mode2WinText, setMode2WinText] = useState('中奖了!');

  // Restaurant management state
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [restaurantName, setRestaurantName] = useState('XX土菜馆');
  const [adRotationTime, setAdRotationTime] = useState(10);
  const [autoSwitchTime, setAutoSwitchTime] = useState(30);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Debouncing timeouts for menu and recommendation updates
  const [menuUpdateTimeouts, setMenuUpdateTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());
  const [recommendationUpdateTimeouts, setRecommendationUpdateTimeouts] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Load initial configuration
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const [configData, restaurantDataResult] = await Promise.all([
        apiService.getConfig(),
        apiService.getRestaurantData()
      ]);
      
      // Update game config state
      setCurrentPlayer(configData.current_player);
      setRemainingSpins(configData.remaining_spins);
      setSelectedMode(configData.mode);
      setMode1Options(configData.mode1_options || []);
      setMode2WinText(configData.mode2_win_text || '中奖了!');
      setCurrentPage(configData.current_page || 'lottery1');
      
      // Update restaurant data state
      setRestaurantData(restaurantDataResult);
      setRestaurantName(restaurantDataResult.config.name);
      setAdRotationTime(restaurantDataResult.config.ad_rotation_time);
      setAutoSwitchTime(restaurantDataResult.config.auto_switch_time);
      setAdvertisements(restaurantDataResult.advertisements || []);
      // Initialize menu items - preserve actual backend data (including empty items)
      const backendMenuItems = restaurantDataResult.menu_items || [];
      const menuItemsForAdmin = [];
      
      for (let i = 0; i < 30; i++) {
        const existingItem = backendMenuItems[i];
        
        if (existingItem) {
          // Backend has data for this slot - use it as-is (even if empty)
          menuItemsForAdmin.push(existingItem);
        } else {
          // No backend data for this slot - use default dish
          const defaultDish = defaultDishes[i];
          menuItemsForAdmin.push({
            id: `menu_${i + 1}`,
            name: defaultDish.name,
            price: defaultDish.price,
            description: '',
            category: '主菜',
            available: true,
            order: i + 1,
            image_url: ''
          });
        }
      }
      
      setMenuItems(menuItemsForAdmin);
      setRecommendations(restaurantDataResult.recommendations || []);
      
      setError('');
    } catch (err: any) {
      console.error('Failed to load config:', err);
      setError('无法加载配置，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize
  useEffect(() => {
    loadConfig();
    
    // Connect WebSocket
    wsService.connect();

    // Listen for config updates from other sources
    const unsubscribe = wsService.onConfigUpdated((data: GameConfig) => {
      setCurrentPlayer(data.current_player);
      setRemainingSpins(data.remaining_spins);
      setSelectedMode(data.mode);
      setMode1Options(data.mode1_options || []);
      setMode2WinText(data.mode2_win_text || '中奖了!');
      setCurrentPage(data.current_page || 'lottery1');
    });

    // Listen for page switching events
    const unsubscribePageSwitch = wsService.on('page_switched', (data: any) => {
      setCurrentPage(data.page);
      if (data.config) {
        setCurrentPlayer(data.config.current_player);
        setRemainingSpins(data.config.remaining_spins);
        setSelectedMode(data.config.mode);
        setMode1Options(data.config.mode1_options || []);
        setMode2WinText(data.config.mode2_win_text || '中奖了!');
      }
    });

    // Listen for advertisement events
    const unsubscribeAdAdded = wsService.on('advertisement_added', (data: any) => {
      setAdvertisements(prev => [...prev, data]);
    });

    const unsubscribeAdDeleted = wsService.on('advertisement_deleted', (data: any) => {
      setAdvertisements(prev => prev.filter(ad => ad.id !== data.id));
    });

    return () => {
      unsubscribe();
      unsubscribePageSwitch();
      unsubscribeAdAdded();
      unsubscribeAdDeleted();
      wsService.disconnect();
      
      // Clear any pending debounced API calls to prevent memory leaks
      menuUpdateTimeouts.forEach(timeout => clearTimeout(timeout));
      recommendationUpdateTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [loadConfig]);

  // Initialize mode1 options if empty
  useEffect(() => {
    if (mode1Options.length === 0) {
      const defaultOptions: PrizeOption[] = [];
      for (let i = 1; i <= 12; i++) {
        defaultOptions.push({
          text: `奖品${i}`,
          probability: Math.round((100 / 12) * 100) / 100
        });
      }
      setMode1Options(defaultOptions);
    }
  }, [mode1Options.length]);

  // Keyboard event system for numpad 1+2+3 combination
  useEffect(() => {
    const pressedKeys = new Set<string>();
    let keyComboTimeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle numpad keys 1, 2, 3
      if (event.code === 'Numpad1' || event.code === 'Numpad2' || event.code === 'Numpad3') {
        event.preventDefault();
        pressedKeys.add(event.code);

        // Clear any existing timeout
        if (keyComboTimeout) {
          clearTimeout(keyComboTimeout);
        }

        // Check if all three keys are pressed AND we're on a lottery page
        if (pressedKeys.size === 3 && 
            pressedKeys.has('Numpad1') && 
            pressedKeys.has('Numpad2') && 
            pressedKeys.has('Numpad3') &&
            (currentPage === 'lottery1' || currentPage === 'lottery2')) {
          
          // Trigger spin
          handleKeyboardSpin();
          
          // Clear pressed keys
          pressedKeys.clear();
        } else {
          // Set timeout to clear keys if combination not completed within 500ms
          keyComboTimeout = setTimeout(() => {
            pressedKeys.clear();
          }, 500);
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Remove released key from pressed keys set
      if (event.code === 'Numpad1' || event.code === 'Numpad2' || event.code === 'Numpad3') {
        pressedKeys.delete(event.code);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      if (keyComboTimeout) {
        clearTimeout(keyComboTimeout);
      }
    };
  }, [currentPage]); // Add currentPage dependency to re-register when page changes

  // Handle keyboard-triggered spin
  const handleKeyboardSpin = async () => {
    try {
      setError('');
      setSuccess('');
      
      // Show feedback that keyboard combo was detected
      setSuccess('键盘组合触发抽奖！(Numpad 1+2+3)');
      
      // Trigger spin via API
      await apiService.spin();
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000);
      
    } catch (err: any) {
      console.error('Keyboard spin failed:', err);
      setError(err.message || '键盘触发抽奖失败');
    }
  };

  // Handle mode1 option change
  const handleMode1OptionChange = (index: number, field: 'text' | 'probability', value: string) => {
    const newOptions = [...mode1Options];
    if (field === 'text') {
      newOptions[index].text = value;
    } else {
      newOptions[index].probability = parseFloat(value) || 0;
    }
    setMode1Options(newOptions);
  };

  // Calculate total probability for mode1
  const getTotalProbability = () => {
    return mode1Options.reduce((sum, option) => sum + option.probability, 0);
  };

  // Handle save configuration
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validate mode1 probabilities
      if (selectedMode === 1) {
        const totalProb = getTotalProbability();
        if (Math.abs(totalProb - 100) > 0.01) {
          throw new Error(`概率总和必须为100%，当前为${totalProb.toFixed(2)}%`);
        }

        // Check for empty texts
        for (let i = 0; i < mode1Options.length; i++) {
          if (!mode1Options[i].text.trim()) {
            throw new Error(`奖品${i + 1}的名称不能为空`);
          }
        }
      }

      // Validate basic fields
      if (currentPlayer < 1) {
        throw new Error('玩家编号必须大于0');
      }
      
      if (remainingSpins < 0) {
        throw new Error('剩余次数不能小于0');
      }

      // Prepare update request
      const updateRequest: ConfigUpdateRequest = {
        mode: selectedMode,
        current_player: currentPlayer,
        remaining_spins: remainingSpins,
      };

      if (selectedMode === 1) {
        updateRequest.mode1_options = mode1Options;
      }
      
      if (selectedMode === 2) {
        // Validate mode2 win text
        if (!mode2WinText.trim()) {
          throw new Error('中奖文本不能为空');
        }
        updateRequest.mode2_win_text = mode2WinText;
      }

      // Save configuration
      await apiService.updateConfig(updateRequest);
      setSuccess('配置保存成功！');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('Failed to save config:', err);
      setError(err.message || '保存配置失败');
    } finally {
      setSaving(false);
    }
  };

  // Handle reset game
  const handleReset = async () => {
    if (!window.confirm('确定要重置游戏吗？这将清空所有历史记录并重置玩家和次数。')) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiService.resetGame();
      await loadConfig(); // Reload config after reset
      setSuccess('游戏重置成功！');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);

    } catch (err: any) {
      console.error('Failed to reset game:', err);
      setError(err.message || '重置游戏失败');
    } finally {
      setSaving(false);
    }
  };

  // Handle page switching
  const handlePageSwitch = async (targetPage: string) => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch('/api/switch-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ page: targetPage }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '切换页面失败');
      }

      setSuccess(`已切换到${getPageDisplayName(targetPage)}`);
      
      // Clear success message after 2 seconds
      setTimeout(() => setSuccess(''), 2000);

    } catch (err: any) {
      console.error('Failed to switch page:', err);
      setError(err.message || '切换页面失败');
    }
  };

  // Get display name for page
  const getPageDisplayName = (page: string) => {
    switch (page) {
      case 'lottery1': return '抽奖模式1';
      case 'lottery2': return '抽奖模式2'; 
      case 'advertisement': return '广告展示页';
      default: return '未知页面';
    }
  };

  // Restaurant management handlers

  // Handle restaurant config save
  const handleSaveRestaurantConfig = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const config: RestaurantConfig = {
        name: restaurantName,
        ad_rotation_time: adRotationTime,
        auto_switch_time: autoSwitchTime,
        enable_auto_switch: false // Keep disabled as per previous fix
      };

      await apiService.updateRestaurantConfig(config);
      setSuccess('餐厅配置已保存');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to save restaurant config:', err);
      setError(err.message || '保存餐厅配置失败');
    } finally {
      setSaving(false);
    }
  };

  // Handle advertisement upload
  const handleAdvertisementUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('图片文件不能超过5MB');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await apiService.uploadAdvertisement(file, file.name);
      // WebSocket listener will handle updating the advertisements list
      setSuccess('广告上传成功');

      // Clear the file input
      if (event.target) {
        event.target.value = '';
      }

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to upload advertisement:', err);
      setError(err.message || '广告上传失败');
    } finally {
      setSaving(false);
    }
  };

  // Handle advertisement deletion
  const handleDeleteAdvertisement = async (id: string) => {
    if (!window.confirm('确定要删除这个广告吗？')) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      await apiService.deleteAdvertisement(id);
      // WebSocket listener will handle updating the advertisements list
      setSuccess('广告删除成功');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to delete advertisement:', err);
      setError(err.message || '删除广告失败');
    }
  };

  // Handle menu item update with debouncing
  const handleMenuItemUpdate = useCallback((id: string, field: keyof MenuItem, value: any) => {
    const item = menuItems.find(m => m.id === id);
    if (!item) return;

    // Update local state immediately for responsive UI
    const updated: MenuItem = { ...item, [field]: value };
    setMenuItems(prev => prev.map(m => m.id === id ? updated : m));

    // Clear existing timeout for this item
    const existingTimeout = menuUpdateTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set up debounced API call
    const newTimeout = setTimeout(async () => {
      try {
        // Always use updateMenuItem - backend should handle both existing and new items
        await apiService.updateMenuItem(id, updated);
        // Optionally show brief success feedback (commented out to reduce noise)
        // setSuccess(`菜品 ${updated.name || '未命名'} 已更新`);
        // setTimeout(() => setSuccess(''), 1000);
      } catch (err: any) {
        console.error('Failed to update menu item:', err);
        setError(err.message || '更新菜单项失败');
        // Revert local state on error
        setMenuItems(prev => prev.map(m => m.id === id ? item : m));
      } finally {
        // Clean up timeout from map
        setMenuUpdateTimeouts(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    }, 800); // 800ms debounce delay

    // Store timeout in map
    setMenuUpdateTimeouts(prev => {
      const newMap = new Map(prev);
      newMap.set(id, newTimeout);
      return newMap;
    });
  }, [menuItems, menuUpdateTimeouts]);


  // Handle add recommendation
  const handleAddRecommendation = async () => {
    const newRec: Omit<Recommendation, 'id' | 'date'> = {
      name: '',
      price: 0,
      description: '',
      special: '',
      active: true,
      order: recommendations.length + 1
    };

    try {
      setError('');
      const result = await apiService.addRecommendation(newRec);
      setRecommendations([...recommendations, result]);
      setSuccess('推荐菜品已添加');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to add recommendation:', err);
      setError(err.message || '添加推荐失败');
    }
  };

  // Handle recommendation update with debouncing
  const handleUpdateRecommendation = useCallback((id: string, field: keyof Recommendation, value: any) => {
    const rec = recommendations.find(r => r.id === id);
    if (!rec) return;

    // Update local state immediately for responsive UI
    const updated: Recommendation = { ...rec, [field]: value };
    setRecommendations(prev => prev.map(r => r.id === id ? updated : r));

    // Clear existing timeout for this recommendation
    const existingTimeout = recommendationUpdateTimeouts.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set up debounced API call
    const newTimeout = setTimeout(async () => {
      try {
        await apiService.updateRecommendation(id, updated);
        // Optionally show brief success feedback (commented out to reduce noise)
        // setSuccess(`推荐 ${updated.name || '未命名'} 已更新`);
        // setTimeout(() => setSuccess(''), 1000);
      } catch (err: any) {
        console.error('Failed to update recommendation:', err);
        setError(err.message || '更新推荐失败');
        // Revert local state on error
        setRecommendations(prev => prev.map(r => r.id === id ? rec : r));
      } finally {
        // Clean up timeout from map
        setRecommendationUpdateTimeouts(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      }
    }, 800); // 800ms debounce delay

    // Store timeout in map
    setRecommendationUpdateTimeouts(prev => {
      const newMap = new Map(prev);
      newMap.set(id, newTimeout);
      return newMap;
    });
  }, [recommendations, recommendationUpdateTimeouts]);

  // Handle delete recommendation
  const handleDeleteRecommendation = async (id: string) => {
    if (!window.confirm('确定要删除这个推荐吗？')) {
      return;
    }

    try {
      await apiService.deleteRecommendation(id);
      setRecommendations(recommendations.filter(r => r.id !== id));
      setSuccess('推荐删除成功');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Failed to delete recommendation:', err);
      setError(err.message || '删除推荐失败');
    }
  };

  if (loading) {
    return (
      <AdminContainer>
        <LoadingMessage>加载中...</LoadingMessage>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer>
      <Header>
        <Title>管理界面</Title>
        <Subtitle>配置游戏模式和参数</Subtitle>
      </Header>

      <ConfigForm>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        {/* Page Control Section */}
        <Section>
          <SectionTitle>页面控制</SectionTitle>
          
          <div style={{ marginBottom: '16px' }}>
            <strong>当前显示页面: </strong>
            <span style={{ 
              color: '#667eea', 
              fontWeight: '600',
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '4px 8px',
              borderRadius: '4px'
            }}>
              {getPageDisplayName(currentPage)}
            </span>
          </div>

          <ButtonGroup>
            <Button 
              $variant={currentPage === 'lottery1' ? 'primary' : 'secondary'}
              onClick={() => handlePageSwitch('lottery1')}
              disabled={saving}
            >
              切换到抽奖模式1
            </Button>
            <Button 
              $variant={currentPage === 'lottery2' ? 'primary' : 'secondary'}
              onClick={() => handlePageSwitch('lottery2')}
              disabled={saving}
            >
              切换到抽奖模式2
            </Button>
            <Button 
              $variant={currentPage === 'advertisement' ? 'primary' : 'secondary'}
              onClick={() => handlePageSwitch('advertisement')}
              disabled={saving}
            >
              切换到广告展示页
            </Button>
          </ButtonGroup>
          
          <div style={{ 
            marginTop: '12px',
            fontSize: '14px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            页面切换将立即同步到所有连接的用户界面
          </div>
        </Section>

        {/* Game Mode Selection - Only shown when on lottery pages */}
        {(currentPage === 'lottery1' || currentPage === 'lottery2') && (
        <Section>
          <SectionTitle>游戏模式</SectionTitle>
          <ModeSelector>
            <ModeButton
              $active={selectedMode === 1}
              onClick={() => setSelectedMode(1)}
            >
              模式1 - 经典模式
            </ModeButton>
            <ModeButton
              $active={selectedMode === 2}
              onClick={() => setSelectedMode(2)}
            >
              模式2 - 固定概率
            </ModeButton>
          </ModeSelector>

          {selectedMode === 1 && (
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                自定义12个奖品及其中奖概率，概率总和必须为100%
              </p>
              <div style={{ marginBottom: '16px', color: '#333' }}>
                <strong>概率总和: {getTotalProbability().toFixed(2)}%</strong>
                {Math.abs(getTotalProbability() - 100) > 0.01 && (
                  <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>
                    (必须为100%)
                  </span>
                )}
              </div>
              <PrizeGrid>
                {mode1Options.map((option, index) => (
                  <PrizeItem key={index}>
                    <PrizeLabel>奖品 {index + 1}</PrizeLabel>
                    <FormGroup>
                      <Input
                        type="text"
                        placeholder="奖品名称"
                        value={option.text}
                        onChange={(e) => handleMode1OptionChange(index, 'text', e.target.value)}
                      />
                    </FormGroup>
                    <PrizeInputGroup>
                      <ProbabilityInput
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={option.probability}
                        onChange={(e) => handleMode1OptionChange(index, 'probability', e.target.value)}
                      />
                      <span style={{ color: '#666' }}>%</span>
                    </PrizeInputGroup>
                  </PrizeItem>
                ))}
              </PrizeGrid>
            </div>
          )}

          {selectedMode === 2 && (
            <div>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                固定模式：11个"再接再厉"，自定义中奖奖品，总中奖率5%
              </p>
              
              <FormGroup style={{ marginBottom: '20px' }}>
                <Label htmlFor="mode2WinText">中奖奖品内容</Label>
                <Input
                  id="mode2WinText"
                  type="text"
                  placeholder="输入中奖时显示的奖品内容"
                  value={mode2WinText}
                  onChange={(e) => setMode2WinText(e.target.value)}
                />
                <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  当用户中奖时，将显示此奖品内容
                </small>
              </FormGroup>

              <Mode2Display>
                {Array.from({ length: 11 }, (_, i) => (
                  <Mode2Item key={i}>
                    <span>再接再厉</span>
                    <span style={{ color: '#666' }}>~8.64%</span>
                  </Mode2Item>
                ))}
                <Mode2Item>
                  <span style={{ color: '#00b894', fontWeight: '600' }}>
                    {mode2WinText || '中奖了!'}
                  </span>
                  <span style={{ color: '#00b894', fontWeight: '600' }}>5%</span>
                </Mode2Item>
              </Mode2Display>
            </div>
          )}
        </Section>
        )}

        {/* Basic Settings - Only shown when on lottery pages */}
        {(currentPage === 'lottery1' || currentPage === 'lottery2') && (
        <Section>
          <SectionTitle>基本设置</SectionTitle>
          
          <FormGroup>
            <Label htmlFor="currentPlayer">当前玩家编号</Label>
            <Input
              id="currentPlayer"
              type="number"
              min="1"
              value={currentPlayer}
              onChange={(e) => setCurrentPlayer(parseInt(e.target.value) || 1)}
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="remainingSpins">剩余抽奖次数</Label>
            <Input
              id="remainingSpins"
              type="number"
              min="0"
              value={remainingSpins}
              onChange={(e) => setRemainingSpins(parseInt(e.target.value) || 0)}
            />
          </FormGroup>
        </Section>
        )}

        {/* Restaurant Management - Only shown when on advertisement page */}
        {currentPage === 'advertisement' && (
        <>
        <Section>
          <SectionTitle>餐厅管理</SectionTitle>
          
          <FormGroup>
            <Label>餐厅名称</Label>
            <Input
              type="text"
              value={restaurantName}
              placeholder="输入餐厅名称"
              onChange={(e) => setRestaurantName(e.target.value)}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              修改餐厅名称后需要保存配置
            </small>
          </FormGroup>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '16px'
          }}>
            <FormGroup>
              <Label>广告轮播间隔 (秒)</Label>
              <Input
                type="number"
                min="5"
                max="60"
                value={adRotationTime}
                onChange={(e) => setAdRotationTime(parseInt(e.target.value) || 10)}
              />
            </FormGroup>
            
            <FormGroup>
              <Label>广告显示时长 (秒)</Label>
              <Input
                type="number"
                min="10"
                max="300"
                value={autoSwitchTime}
                onChange={(e) => setAutoSwitchTime(parseInt(e.target.value) || 30)}
              />
            </FormGroup>
          </div>
          
          <div style={{ marginTop: '16px' }}>
            <Button 
              $variant="primary"
              onClick={handleSaveRestaurantConfig}
              disabled={saving}
            >
              {saving ? '保存中...' : '保存餐厅配置'}
            </Button>
          </div>
        </Section>

        {/* Advertisement Management */}
        <Section>
          <SectionTitle>广告管理</SectionTitle>
          
          <div style={{ marginBottom: '16px' }}>
            <Label>上传广告图片</Label>
            <div style={{ 
              border: '2px dashed #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              marginTop: '8px'
            }}>
              <div style={{ color: '#666', fontSize: '16px', marginBottom: '8px' }}>
                📸 拖拽图片到此处或点击上传
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAdvertisementUpload}
                style={{ display: 'none' }}
                id="advertisement-upload"
                disabled={saving}
              />
              <label htmlFor="advertisement-upload">
                <Button 
                  $variant="secondary" 
                  as="span"
                  style={{ cursor: saving ? 'not-allowed' : 'pointer' }}
                >
                  {saving ? '上传中...' : '选择图片文件'}
                </Button>
              </label>
              <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                支持 JPG、PNG、GIF 格式，建议尺寸 1920x1080，最大5MB
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong>当前广告列表 ({advertisements.length} 项):</strong>
            <div style={{
              marginTop: '8px',
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              {advertisements.length === 0 ? (
                <div style={{ color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                  暂无广告图片，请上传广告文件
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {advertisements.map((ad) => (
                    <div key={ad.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid #dee2e6'
                    }}>
                      <div>
                        <strong>{ad.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {ad.filename} • {ad.created ? new Date(ad.created).toLocaleDateString('zh-CN') : '未知日期'}
                        </div>
                      </div>
                      <Button
                        $variant="danger"
                        onClick={() => handleDeleteAdvertisement(ad.id)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* Menu Management */}
        <Section>
          <SectionTitle>菜单管理 (30项)</SectionTitle>
          
          <div style={{
            marginBottom: '16px',
            fontSize: '14px',
            color: '#666'
          }}>
            配置餐厅菜单项，将显示在广告页面底部
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px',
            maxHeight: '500px',
            overflowY: 'auto',
            padding: '4px'
          }}>
            {menuItems.map((item, i) => (
              <div key={item.id} style={{
                border: '1px solid #e1e5e9',
                borderRadius: '8px',
                padding: '12px',
                background: '#f8f9fa'
              }}>
                <div style={{ 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  fontSize: '14px' 
                }}>
                  <span>菜品 {i + 1}</span>
                </div>
                <FormGroup style={{ marginBottom: '8px' }}>
                  <Input
                    type="text"
                    placeholder="菜品名称"
                    value={item.name}
                    onChange={(e) => handleMenuItemUpdate(item.id, 'name', e.target.value)}
                    style={{ 
                      fontSize: '14px', 
                      padding: '6px 8px'
                    }}
                  />
                </FormGroup>
                <FormGroup style={{ marginBottom: '8px' }}>
                  <Input
                    type="number"
                    placeholder="价格"
                    step="0.01"
                    min="0"
                    value={item.price || ''}
                    onChange={(e) => handleMenuItemUpdate(item.id, 'price', parseFloat(e.target.value) || 0)}
                    style={{ 
                      fontSize: '14px', 
                      padding: '6px 8px'
                    }}
                  />
                </FormGroup>
              </div>
            ))}
          </div>
        </Section>

        {/* Today's Recommendations Management */}
        <Section>
          <SectionTitle>今日推荐管理</SectionTitle>
          
          <div style={{ marginBottom: '16px' }}>
            <ButtonGroup>
              <Button 
                $variant="primary"
                onClick={handleAddRecommendation}
              >
                添加推荐菜品
              </Button>
            </ButtonGroup>
          </div>

          <div style={{
            padding: '16px',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            {recommendations.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', fontStyle: 'italic' }}>
                暂无今日推荐菜品
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {recommendations.map((rec) => (
                  <div key={rec.id} style={{
                    background: 'white',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 120px auto',
                      gap: '12px',
                      alignItems: 'center'
                    }}>
                      <FormGroup style={{ margin: 0 }}>
                        <Input
                          type="text"
                          placeholder="菜品名称"
                          value={rec.name}
                          onChange={(e) => handleUpdateRecommendation(rec.id, 'name', e.target.value)}
                          style={{ fontSize: '14px' }}
                        />
                      </FormGroup>
                      <FormGroup style={{ margin: 0 }}>
                        <Input
                          type="number"
                          placeholder="价格"
                          step="0.01"
                          min="0"
                          value={rec.price || ''}
                          onChange={(e) => handleUpdateRecommendation(rec.id, 'price', parseFloat(e.target.value) || 0)}
                          style={{ fontSize: '14px' }}
                        />
                      </FormGroup>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="checkbox"
                          checked={rec.active}
                          onChange={(e) => handleUpdateRecommendation(rec.id, 'active', e.target.checked)}
                        />
                        <span style={{ fontSize: '14px' }}>启用</span>
                      </div>
                      <Button
                        $variant="danger"
                        onClick={() => handleDeleteRecommendation(rec.id)}
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>
        </>
        )}

        {/* Actions - Only shown when on lottery pages */}
        {(currentPage === 'lottery1' || currentPage === 'lottery2') && (
        <Section>
          <SectionTitle>操作</SectionTitle>
          <ButtonGroup>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '保存中...' : '保存配置'}
            </Button>
            <Button $variant="danger" onClick={handleReset} disabled={saving}>
              重置游戏
            </Button>
            <Button
              $variant="secondary"
              onClick={() => window.open('/user', '_blank')}
            >
              打开用户界面
            </Button>
          </ButtonGroup>
          
          <div style={{ 
            marginTop: '20px', 
            padding: '12px', 
            background: 'rgba(102, 126, 234, 0.1)', 
            border: '1px solid #667eea', 
            borderRadius: '8px',
            fontSize: '14px',
            color: '#555'
          }}>
            <strong>快捷键:</strong> 同时按下数字键盘的 1、2、3 键可触发抽奖
            <br />
            <small>用于外接物理按键设备控制</small>
          </div>
        </Section>
        )}
      </ConfigForm>
    </AdminContainer>
  );
};

export default Admin;