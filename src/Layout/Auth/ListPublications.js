    
    import React, { useEffect, useState, useRef } from 'react'
    import { ActivityIndicator, FlatList, StyleSheet, View, Text, Image, Alert, TouchableOpacity } from 'react-native';
    import {IconButton, Subheading} from 'react-native-paper'
    //Modal,
    import firestore from '@react-native-firebase/firestore';
    import auth from '@react-native-firebase/auth';
    import { ListItem, Button, Icon, Header } from 'react-native-elements';
    import Modal from 'react-native-modal';
    import { Card, CardTitle, CardContent, CardAction, CardButton, CardImage } from 'react-native-material-cards'
    
    import { State } from 'react-native-gesture-handler';
    import PickerCheckBox from 'react-native-picker-checkbox';
    import { Picker } from '@react-native-picker/picker';
    import { useIsFocused } from '@react-navigation/native'
    //Button, Card, Icon, Avatar
    import RBSheet from "react-native-raw-bottom-sheet";
    import moment from 'moment'
    import 'moment/locale/es'
    
    moment.locale('es')
    
    export default function ListPublications({ navigation }) {

      const refRBSheet = useRef();


      const isFocused = useIsFocused()
      const user = auth().currentUser
      var checkedItem = [];
      const [publications, setPublications] = useState([]);
      const [isModalVisible, setModalVisible] = useState(false);
      const [isModaReenviarlVisible, setModalReenviarlVisible] = useState(false);
      const [selectedPost, setPost] = useState([]);
      const [filterPublications, setFilterPublications] = useState([]);
      const [destinatarios, setDestinatarios] = useState([]);
      const [localUser, setLocalUser] = useState({
        doc_id: "",
        nombres: "",
        apellidos: "",
        correo: "",
        id_rol: "",
        grupo: "",
        url: ""
      });
    
      const toggleModal = () => {
        setModalVisible(!isModalVisible);
      };
    
      const toggleModalReenviar = () => {
        setModalReenviarlVisible(!isModaReenviarlVisible);
      };
    
    
      const functionCombined = (item) => {
        refRBSheet.current.open()
        setPost(item);
      };
    
      const functionCombinedResend = (items) => {
        
        reSendPost(items);
    
      };
    
    
      const deletePost = (answer) => {
        if (answer) {
          var dPost = 'Publication/' + selectedPost.key;
          console.log(dPost+' = Valor')
          firestore().doc(dPost).delete()
            .then(result => {
              //console.log('Successfully deleted document');
              refRBSheet.current.close()
              navigation.navigate('Home')
              selectedPost = [];
            })
            .catch(err => {
              console.log('Delete failed with: ', err);
            });
        }
      };
    
      const reSendPost = (items) => {
        if (items.length > 0) {
          var destina = '';
          items.map((item) => {
            destina = destina + item.itemDescription + ',';
          });
          firestore().collection('Publication').add({
            id: selectedPost.id,
            titulo: selectedPost.titulo,
            cuerpo: selectedPost.cuerpo,
            date: selectedPost.date,
            destinatario: destina,
            url: selectedPost.url,
            
          })
            .then(result => {
              toggleModalReenviar();
              refRBSheet.current.close()
              toggleModal();
              Alert.alert('Mensaje enviado correctamente')
              selectedPost = [];
            })
            .catch(err => {
              console.log('Delete failed with: ', err);
            });
        } else {
          toggleModalReenviar();
        }
      };
    
      const alertAction = (action) => {
        if (action === 1) {
          Alert.alert('Eliminar mensaje', '¿Esta seguro que desea eliminar el mensaje?', [
            {
              text: "Cancelar",
              onPress: () => deletePost(false),
              style: "cancel"
            },
            { text: "OK", onPress: () => deletePost(true) }
          ])
        } else if (action === 2) {
          toggleModalReenviar();
        }
      };
    
      useEffect(() => {
        firestore()
        .collection('Usuario')
        .where('email', '==', user.email)
        .get()
        .then(querySnapshot => {
          const usuario = querySnapshot.docs[0].data()
          const docId = querySnapshot.docs[0].id
          setLocalUser({
            doc_id: docId,
            nombres:usuario.nombres, 
            apellidos:usuario.apellidos,
            correo:usuario.email,
            rol:usuario.id_rol,
            grupo:usuario.id_grupo,
            url:usuario.url,
          });
        });
      },[isFocused]);
    
      useEffect(() => {
        const subscriber = firestore()
          .collection('Publication')
          .orderBy('date', 'desc')
          .onSnapshot(querySnapshot => {
            const publications = [];
    
            querySnapshot.forEach(documentSnapshot => {
              publications.push({
                ...documentSnapshot.data(),
                key: documentSnapshot.id,
              });
            });
    
            setPublications(publications);
            //setLoading(false);
          });
        return () => subscriber();
      }, []);
      
      useEffect(() => {
        //RAMAS
        firestore()
          .collection('Grupo')
          .orderBy('nombre')
          .get()
          .then(querySnapshot => {
            let grupo
            let datosRamas = []
            for (let i = 0; i < querySnapshot.size; i++) {
              grupo = querySnapshot.docs[i].data();
              datosRamas.push({ itemKey: i, itemDescription: grupo.nombre });
            }
            setDestinatarios(datosRamas);
          });
      }, []);
    
    
      const updateFilter = (filterRama) => {
        ///// Sort Publications Descending
        publications.sort((a, b) => (b.date - a.date))
    
        // apply filter
          const filteredData = filterRama
          ? publications.filter(x =>
            x.destinatario.toLowerCase().includes(filterRama.toLowerCase())
          )
          : publications; 
    
        setFilterPublications(filteredData);
      };
    
      const updateFilter2 = (filterSort) => {
        //let filteredData = null;
        setSortStatus(filterSort);
        console.log( "esta es la sort en filter 2 " + SortStatus);
        console.log( "esta es la rama en filter 2 " + RamaStatus);
        updateFilter(RamaStatus);
    
    
        //setFilterPublications(filteredData);
      };
    
    
    
      const pickerItems = () => {
        let serviceItems;
        if (localUser.rol === "Administrador") {
          serviceItems = destinatarios.map((x, i) => {
            return (<Picker.Item label={x.itemDescription} key={i} value={x.itemDescription} />)
          });
        } else {
          serviceItems = destinatarios.map((x, i) => {
            if (localUser.grupo === x.itemDescription) {
              return (<Picker.Item label={x.itemDescription} key={i} value={x.itemDescription} />)
            }
          });
        }
        return serviceItems;
      }
    
    
      return (
        <View style={{ flex: 1 }}>
          <Header
            containerStyle={{
              backgroundColor: '#b31d1d',
              justifyContent: 'space-around',
            }}
            //leftComponent={{ icon: 'reply', color: '#fff', }}
            leftComponent={<Icon
              name='keyboard-backspace'
              color='#fff'
              iconStyle={{ fontSize: 27 }}
              onPress={() => navigation.navigate('Home')}
            />
    
            }
            centerComponent={{ text: 'MENSAJES', style: { color: '#fff' } }}
    
          />

          <RBSheet
              ref={refRBSheet}
              closeOnDragDown={true}
              closeOnPressMask={false}
              height={180}
              customStyles={{
                  wrapper: {
                      backgroundColor: 'rgba(0,0,0,0.5)',
                  },
                  draggableIcon: {
                      backgroundColor: '#b31d1d'
                  }
              }}
          >
              <View style={{ flexDirection: 'column', justifyContent: 'center', alignContent: 'center', marginTop: '2%' }}>
                  <TouchableOpacity
                      onPress={() => alertAction(1)}
                      style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: '2%'
                      }}>
                      <IconButton
                          color='gray'
                          icon='delete'
                      />
                      <Subheading>Eliminar</Subheading>
                  </TouchableOpacity>
                  <TouchableOpacity
                      onPress={() => alertAction(2)}
                      style={{
                          flexDirection: 'row',
                          alignItems: 'center'
                      }}
                  >
                      <IconButton
                          color='gray'
                          icon='send'
                      />
                      <Subheading>Reenviar</Subheading>
                  </TouchableOpacity>
              </View>
          </RBSheet>
                        
          <Modal isVisible={isModaReenviarlVisible}>
            <View style={styles.centeredView2}>
              <View style={styles.modalView2}>
    
                <PickerCheckBox
                  data={destinatarios}
    
                  headerComponent={<Text style={{ fontSize: 25 }} >Destinatarios</Text>}
                  OnConfirm={(pItems) =>  functionCombinedResend(pItems)}
                  ConfirmButtonTitle='OK'
                  DescriptionField='itemDescription'
                  KeyField='itemKey'
                  placeholder='Destinatarios'
                  arrowColor='#000000'
                  arrowSize={10}
                  placeholderSelectedItems='$count selected item(s)'
                />
    
              </View>
            </View>
          </Modal>
    
          <Picker onValueChange={updateFilter}>
            {pickerItems()}
          </Picker>
    
          <FlatList
            data={filterPublications} //{publications}
            renderItem={({ item }) => (
              <Card>
                <CardAction
                  separator={true}
                  inColumn={false}>
                  <CardTitle
    
                    titleStyle={styles.txtTitulo}
                    title={item.titulo}
                  />
                  { localUser.rol == 'Administrador' ? (
                  <Button
                    theme={{ colors: { primary: '#ffffff' } }}
                    icon={<Icon name='more-vert' color='#8E0101' />}
                    buttonStyle={{ borderRadius: 10, marginLeft: 0, marginRight: 0, marginBottom: 0 }}
                    onPress={() => functionCombined(item)} 
                  />
                    ):(
                      <></>
                    )}
                  
                </CardAction>
                <CardImage
                  source={{ uri: item.url }}
                //source={{ uri: 'http://placehold.it/480x270' }}
                />
    
                <CardContent textStyle={{ color: 'black', fontSize: 15, width: '100%' }}  >
                <Text
                
                >
                {moment(new Date(item.date.toDate())).format('dddd D [de] MMMM [del] YYYY, h:mm:ss a')}
                </Text>
                 {true ?  <Text numberOfLines={5} style={{ width: '100%', color:'black' }}>{item.cuerpo}</Text>:null}
                  
              
                </CardContent>
                <CardAction
                  separator={true}
                  inColumn={false}>
                  <CardButton
                      onPress={() => navigation.navigate('ListPublicationDetail', {
                        items: {
                          id: item.id,
                          title: item.titulo,
                          cuerpo: item.cuerpo,
                          url: item.url,
                          dates: item.date,
                          dest: item.destinatario,
                        }
                      })} 
                      
                      title="ver mas..."
                      color="#8E0101"
                  />
                </CardAction>
              </Card>
            )}
          />
    
        </View>
      );
    }
    
    const styles = StyleSheet.create({
      loginButtonSection: {
        
        width: '100%',
        marginTop: 2,
        marginBottom: 25,
        justifyContent: 'center',
        alignItems: 'center'
      },
      centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 22
      },
      centeredView2: {
        flex: 1,
        justifyContent: "center",
        color: 'black',
        fontWeight: "bold",
        marginTop: 22
      },
      modalView: {
        //margin: 50,
        color: "black",
        backgroundColor: "#FFFFFF",
        borderRadius: 5,
        padding: 100,
        paddingBottom: 0,
        paddingTop: 20,
        alignItems: "center",
        /*shadowColor: "#FB2C00",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5*/
      },
      modalView2: {
        //margin: 50,
        color: "black",
        backgroundColor: "white",
        borderRadius: 5,
        padding: 90,
        paddingBottom: 20,
        paddingTop: 30,
    
        /*shadowColor: "#FB2C00",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5*/
      },
      button: {
        borderRadius: 5,
        marginTop: 20,
        padding: 10,
        elevation: 2
      },
      buttonOption: {
        borderRadius: 5,
        marginTop: 5,
        padding: 10,
        elevation: 2
      },
      buttonOpen: {
        backgroundColor: "#B10000",
      },
      buttonClose: {
        backgroundColor: "#B10000",
      },
      textStyle: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
      },
      textStyle2: {
        color: "black"
    
      },
      modalText: {
        color: "#4C4C4C",
        marginBottom: 30,
        alignContent: 'center',
        justifyContent: 'center',
        fontWeight: "bold",
        fontSize: 25
      },
      txtTitulo: {
        textAlign: 'center',
        fontSize: 25,
        fontWeight: 'bold',
        //  color:'black',
        marginTop: 8
      },
      pickerSelectStyles: {
        fontSize: 16,
        paddingHorizontal: 15,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        color: 'black',
        paddingRight: 30,
        backgroundColor: '#fff'
      }
    
    
    });