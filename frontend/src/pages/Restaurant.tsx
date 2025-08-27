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
  font-size: 48px;
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

const Sidebar = styled.div`
  width: 220px;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SidebarSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 24px;
  font-weight: bold;
  margin: 0 0 15px 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  
  &::before {
    content: '📍';
    margin-right: 8px;
    font-size: 20px;
  }
`;

const CenterArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 15px;
`;

const AdvertisementSection = styled.div`
  width: 40%;
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
  height: 450px;
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
  font-size: 36px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
`;

const MenuSection = styled.div`
  width: 60%;
  display: flex;
  flex-direction: column;
`;

const MenuArea = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  flex: 1;
`;

const MenuGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 10px;
  margin-top: 10px;
`;

const MenuItemCard = styled.div<{ $available: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid ${props => props.$available ? 'rgba(0, 255, 0, 0.3)' : 'rgba(128, 128, 128, 0.3)'};
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  font-size: 12px;
  min-height: 75px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  opacity: ${props => props.$available ? 1 : 0.5};
`;

const MenuItemName = styled.div`
  font-weight: bold;
  margin-bottom: 4px;
  color: #ffffff;
  font-size: 11px;
`;

const MenuItemPrice = styled.div`
  color: #667eea;
  font-weight: 500;
  font-size: 10px;
`;

const RecommendationItem = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const RecommendationName = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #ffffff;
  margin-bottom: 8px;
`;

const RecommendationDetails = styled.div`
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 6px;
`;

const RecommendationPrice = styled.div`
  font-weight: bold;
  font-size: 16px;
  color: #667eea;
`;

const RecommendationSpecial = styled.div`
  background: rgba(102, 126, 234, 0.2);
  border: 1px solid rgba(102, 126, 234, 0.5);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  color: #667eea;
  font-weight: bold;
  display: inline-block;
  margin-top: 8px;
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
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid white;
  background: ${props => props.$active ? 'white' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: ${props => props.$active ? 1 : 0.6};
  
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
        <Sidebar>
          <SidebarSection>
            <SectionTitle>今日推荐</SectionTitle>
            {activeRecommendations.length > 0 ? (
              activeRecommendations.map((rec) => (
                <RecommendationItem key={rec.id}>
                  <RecommendationName>{rec.name}</RecommendationName>
                  {rec.description && (
                    <RecommendationDetails>{rec.description}</RecommendationDetails>
                  )}
                  <RecommendationPrice>¥{rec.price.toFixed(2)}</RecommendationPrice>
                  {rec.special && (
                    <RecommendationSpecial>{rec.special}</RecommendationSpecial>
                  )}
                </RecommendationItem>
              ))
            ) : (
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center', padding: '20px 0' }}>
                暂无推荐菜品
              </div>
            )}
          </SidebarSection>
        </Sidebar>

        <CenterArea>
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

          <MenuSection>
            <MenuArea>
              <SectionTitle>菜单</SectionTitle>
              <MenuGrid>
                {restaurantData.menu_items.slice(0, 30).map((item, index) => (
                  <MenuItemCard key={item.id} $available={item.available && item.name.trim() !== ''}>
                    <MenuItemName>
                      {item.name.trim() || `菜品${index + 1}`}
                    </MenuItemName>
                    {item.price > 0 && (
                      <MenuItemPrice>¥{item.price.toFixed(2)}</MenuItemPrice>
                    )}
                  </MenuItemCard>
                ))}
              </MenuGrid>
            </MenuArea>
          </MenuSection>
        </CenterArea>
      </MainContent>
    </RestaurantContainer>
  );
};

export default Restaurant;