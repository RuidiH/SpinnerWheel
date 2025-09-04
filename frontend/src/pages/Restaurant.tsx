import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { wsService } from '../services/websocket';

// Types for restaurant data (will match backend models)
interface RestaurantConfig {
  name: string;
  ad_rotation_time: number;
  auto_switch_time: number;
  enable_auto_switch: boolean;
}

interface Advertisement {
  id: string;
  filename: string;
  name: string;
  active: boolean;
  order: number;
  created: string;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  available: boolean;
  order: number;
  image_url: string;
}

interface Recommendation {
  id: string;
  name: string;
  price: number;
  description: string;
  special: string;
  active: boolean;
  order: number;
  date: string;
}

interface RestaurantData {
  config: RestaurantConfig;
  advertisements: Advertisement[];
  menu_items: MenuItem[];
  recommendations: Recommendation[];
}

// Styled Components  
const RestaurantContainer = styled.div`
  min-height: 100vh;
  color: white;
  font-family: 'Microsoft YaHei', 'Noto Sans CJK SC', sans-serif;
  display: flex;
  flex-direction: column;
  padding: 10px;
`;

const Header = styled.header`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 15px;
`;

const RestaurantName = styled.h1`
  font-size: 52px;
  font-weight: bold;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  color: white;
`;

const DateTime = styled.div`
  text-align: right;
  font-size: 24px;
  font-weight: 500;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  padding: 15px;
  gap: 15px;
  min-height: 0;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  
  &::before {
    content: '📍';
    margin-right: 5px;
    font-size: 16px;
  }
`;

const CompactSectionTitle = styled.h3`
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 5px 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  
  &::before {
    content: '⭐';
    margin-right: 5px;
    font-size: 13px;
  }
`;

const AdvertisementSection = styled.div`
  width: 30%;
  display: flex;
  flex-direction: column;
`;

const AdvertisementArea = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  flex: 1;
  overflow: hidden;
  position: relative;
`;

const AdvertisementImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 10px;
`;

const NoAdvertisementText = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
  padding: 20px;
  line-height: 1.4;
`;

const MenuSection = styled.div`
  width: 70%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 600px;
`;

const MenuArea = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 10px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  flex: 1;
`;

const MenuColumns = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 8px;
`;

const MenuColumn = styled.div`
  flex: 1;
`;

const MenuRow = styled.div<{ $isLast?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: ${props => props.$isLast ? 'none' : '1px solid rgba(255, 255, 255, 0.1)'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.05);
    padding-left: 4px;
    transition: all 0.3s ease;
  }
`;

const MenuItemName = styled.span`
  font-weight: 500;
  color: #ffffff;
  font-size: 18px;
  flex: 1;
  line-height: 1.3;
`;

const MenuItemPrice = styled.span`
  color: #FFD700;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.3;
`;

const RecommendationSection = styled.div`
  margin-bottom: 8px;
`;

const RecommendationColumns = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 5px;
`;

const RecommendationColumn = styled.div`
  flex: 1;
`;

const RecommendationItem = styled.div<{ $isLast?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: ${props => props.$isLast ? 'none' : '1px solid rgba(102, 126, 234, 0.3)'};
  background: rgba(102, 126, 234, 0.05);
  padding-left: 4px;
  padding-right: 4px;
  
  &:hover {
    background: rgba(102, 126, 234, 0.1);
    transition: all 0.3s ease;
  }
`;

const RecommendationName = styled.span`
  font-weight: 500;
  font-size: 19px;
  color: #ffffff;
  line-height: 1.3;
`;

const RecommendationPrice = styled.span`
  font-weight: bold;
  font-size: 19px;
  color: #FFD700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.3;
`;

const LoadingMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
`;

const CarouselIndicators = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
`;

const CarouselDot = styled.button<{ $active: boolean }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  background: ${props => props.$active ? 'white' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.$active ? 1 : 0.6};
  flex-shrink: 0;
  box-sizing: border-box;
  
  &:hover {
    opacity: 1;
  }
`;

const Restaurant: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [restaurantData, setRestaurantData] = useState<RestaurantData | null>(null);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Update date/time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load restaurant data
  const loadRestaurantData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/restaurant');
      if (!response.ok) {
        throw new Error('Failed to load restaurant data');
      }
      const data = await response.json();
      setRestaurantData(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to load restaurant data:', err);
      setError('加载餐厅数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize WebSocket and load data
  useEffect(() => {
    loadRestaurantData();
    
    // Connect WebSocket for real-time updates
    wsService.connect();

    // Listen for restaurant data updates
    const unsubscribeRestaurant = wsService.on('restaurant_config_updated', (data: RestaurantConfig) => {
      setRestaurantData(prev => prev ? { ...prev, config: data } : null);
    });

    const unsubscribeAd = wsService.on('advertisement_added', () => {
      loadRestaurantData(); // Reload all data when ads change
    });

    const unsubscribeAdDeleted = wsService.on('advertisement_deleted', () => {
      loadRestaurantData();
    });

    const unsubscribeMenu = wsService.on('menu_item_updated', () => {
      loadRestaurantData();
    });

    const unsubscribeRec = wsService.on('recommendation_added', () => {
      loadRestaurantData();
    });

    const unsubscribeRecUpdated = wsService.on('recommendation_updated', () => {
      loadRestaurantData();
    });

    const unsubscribeRecDeleted = wsService.on('recommendation_deleted', () => {
      loadRestaurantData();
    });

    // Cleanup
    return () => {
      unsubscribeRestaurant();
      unsubscribeAd();
      unsubscribeAdDeleted();
      unsubscribeMenu();
      unsubscribeRec();
      unsubscribeRecUpdated();
      unsubscribeRecDeleted();
      wsService.disconnect();
    };
  }, [loadRestaurantData]);

  // Handle advertisement rotation
  useEffect(() => {
    if (!restaurantData || restaurantData.advertisements.length === 0) {
      return;
    }

    const activeAds = restaurantData.advertisements.filter(ad => ad.active);
    if (activeAds.length === 0) {
      return;
    }

    const rotationTime = restaurantData.config.ad_rotation_time * 1000; // Convert to milliseconds
    const timer = setInterval(() => {
      setCurrentAdIndex(prev => (prev + 1) % activeAds.length);
    }, rotationTime);

    return () => clearInterval(timer);
  }, [restaurantData]);

  // Handle manual navigation to specific ad
  const handleDotClick = (index: number) => {
    setCurrentAdIndex(index);
  };

  // Generate menu items with default placeholder dishes
  const getMenuItemsWithDefaults = () => {
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

    const menuItems = [];
    
    // Show menu items that have names (admin controls by entering/removing names)
    if (restaurantData?.menu_items) {
      for (let i = 0; i < restaurantData.menu_items.length; i++) {
        const existingItem = restaurantData.menu_items[i];
        
        // Show items that have names
        if (existingItem && existingItem.name && existingItem.name.trim() !== '') {
          menuItems.push({
            id: existingItem.id,
            name: existingItem.name,
            price: existingItem.price
          });
        }
      }
    }
    
    // If no items from admin, show default dishes
    if (menuItems.length === 0) {
      for (let i = 0; i < Math.min(defaultDishes.length, 30); i++) {
        const defaultDish = defaultDishes[i];
        menuItems.push({
          id: `default_${i + 1}`,
          name: defaultDish.name,
          price: defaultDish.price
        });
      }
    }
    
    return menuItems; // Return items with names (admin controls by adding/removing names)
  };

  // Format date and time
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const weekday = weekdays[date.getDay()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return {
      date: `${year}年${month}月${day}号 ${weekday}`,
      time: `${hours}:${minutes}:${seconds}`
    };
  };

  if (loading) {
    return (
      <RestaurantContainer>
        <LoadingMessage>加载中...</LoadingMessage>
      </RestaurantContainer>
    );
  }

  if (error) {
    return (
      <RestaurantContainer>
        <LoadingMessage>{error}</LoadingMessage>
      </RestaurantContainer>
    );
  }

  if (!restaurantData) {
    return (
      <RestaurantContainer>
        <LoadingMessage>无餐厅数据</LoadingMessage>
      </RestaurantContainer>
    );
  }

  const { date, time } = formatDateTime(currentDateTime);
  const activeAds = restaurantData.advertisements.filter(ad => ad.active);
  const currentAd = activeAds[currentAdIndex];
  const activeRecommendations = restaurantData.recommendations
    .filter(rec => rec.active && rec.name && rec.name.trim() !== '')
    .sort((a, b) => a.order - b.order);

  return (
    <RestaurantContainer>
      <Header>
        <RestaurantName>{restaurantData.config.name}</RestaurantName>
        <DateTime>
          <div>{date}</div>
          <div>{time}</div>
        </DateTime>
      </Header>

      <MainContent>
        <MenuSection>
          {/* Recommendations Section - Minimal wrapper, only show if there are recommendations */}
          {activeRecommendations.length > 0 && (
            <RecommendationSection>
              <CompactSectionTitle>今日推荐</CompactSectionTitle>
              <RecommendationColumns>
                <RecommendationColumn>
                  {activeRecommendations.slice(0, Math.ceil(activeRecommendations.length / 3)).map((rec, index, arr) => (
                    <RecommendationItem key={rec.id} $isLast={index === arr.length - 1}>
                      <RecommendationName>{rec.name}</RecommendationName>
                      <RecommendationPrice>¥{rec.price.toFixed(2)}</RecommendationPrice>
                    </RecommendationItem>
                  ))}
                </RecommendationColumn>
                <RecommendationColumn>
                  {activeRecommendations.slice(Math.ceil(activeRecommendations.length / 3), Math.ceil(activeRecommendations.length * 2 / 3)).map((rec, index, arr) => (
                    <RecommendationItem key={rec.id} $isLast={index === arr.length - 1}>
                      <RecommendationName>{rec.name}</RecommendationName>
                      <RecommendationPrice>¥{rec.price.toFixed(2)}</RecommendationPrice>
                    </RecommendationItem>
                  ))}
                </RecommendationColumn>
                <RecommendationColumn>
                  {activeRecommendations.slice(Math.ceil(activeRecommendations.length * 2 / 3)).map((rec, index, arr) => (
                    <RecommendationItem key={rec.id} $isLast={index === arr.length - 1}>
                      <RecommendationName>{rec.name}</RecommendationName>
                      <RecommendationPrice>¥{rec.price.toFixed(2)}</RecommendationPrice>
                    </RecommendationItem>
                  ))}
                </RecommendationColumn>
              </RecommendationColumns>
            </RecommendationSection>
          )}

          {/* Menu Section */}
          <MenuArea>
            <SectionTitle>菜单</SectionTitle>
            <MenuColumns>
              <MenuColumn>
                {getMenuItemsWithDefaults().slice(0, 10).map((item, index) => (
                  <MenuRow key={item.id} $isLast={index === 9}>
                    <MenuItemName>{item.name}</MenuItemName>
                    <MenuItemPrice>¥{item.price.toFixed(2)}</MenuItemPrice>
                  </MenuRow>
                ))}
              </MenuColumn>
              <MenuColumn>
                {getMenuItemsWithDefaults().slice(10, 20).map((item, index) => (
                  <MenuRow key={item.id} $isLast={index === 9}>
                    <MenuItemName>{item.name}</MenuItemName>
                    <MenuItemPrice>¥{item.price.toFixed(2)}</MenuItemPrice>
                  </MenuRow>
                ))}
              </MenuColumn>
              <MenuColumn>
                {getMenuItemsWithDefaults().slice(20, 30).map((item, index) => (
                  <MenuRow key={item.id} $isLast={index === 9}>
                    <MenuItemName>{item.name}</MenuItemName>
                    <MenuItemPrice>¥{item.price.toFixed(2)}</MenuItemPrice>
                  </MenuRow>
                ))}
              </MenuColumn>
            </MenuColumns>
          </MenuArea>
        </MenuSection>

        <AdvertisementSection>
          <AdvertisementArea>
            {currentAd ? (
              <AdvertisementImage
                src={`/uploads/${currentAd.filename}`}
                alt={currentAd.name}
                onError={(e) => {
                  console.error('Failed to load advertisement image:', currentAd.filename);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <NoAdvertisementText>这个区域轮播广告</NoAdvertisementText>
            )}
            
            {/* Carousel Indicators - Show only when there are multiple ads */}
            {activeAds.length > 1 && (
              <CarouselIndicators>
                {activeAds.map((_, index) => (
                  <CarouselDot
                    key={index}
                    $active={index === currentAdIndex}
                    onClick={() => handleDotClick(index)}
                  />
                ))}
              </CarouselIndicators>
            )}
          </AdvertisementArea>
        </AdvertisementSection>
      </MainContent>
    </RestaurantContainer>
  );
};

export default Restaurant;